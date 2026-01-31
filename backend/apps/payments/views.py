from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Q, F
from django.utils import timezone
from decimal import Decimal
from collections import defaultdict
from .models import Settlement, PaymentMethod, Payment
from .serializers import SettlementSerializer, PaymentMethodSerializer, PaymentSerializer
from .debt_simplifier import DebtSimplifier
from apps.expenses.models import ExpenseShare
from apps.groups.models import Group
from apps.core.models import Currency


class SettlementViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing settlements
    """
    serializer_class = SettlementSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return Settlement.objects.filter(
            Q(payer=user) | Q(payee=user)
        ).distinct().order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save()
    
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Confirm a settlement"""
        settlement = self.get_object()
        user = request.user
        
        if user == settlement.payer:
            settlement.confirm_by_payer()
        elif user == settlement.payee:
            settlement.confirm_by_payee()
        else:
            return Response(
                {'detail': 'You are not authorized to confirm this settlement'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        settlement.save()
        return Response(SettlementSerializer(settlement).data)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark settlement as completed"""
        settlement = self.get_object()
        
        if settlement.payer != request.user:
            return Response(
                {'detail': 'Only the payer can mark settlement as completed'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        settlement.mark_as_completed()
        return Response(SettlementSerializer(settlement).data)


class PaymentMethodViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing payment methods
    """
    serializer_class = PaymentMethodSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return PaymentMethod.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_balances(request):
    """Get user balances (simplified debts)"""
    user = request.user
    group_id = request.query_params.get('group_id')
    
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    # Get all expense shares where user is involved (unsettled only)
    shares_qs = ExpenseShare.objects.filter(
        Q(user=user) | Q(paid_by=user),
        is_settled=False
    ).select_related('user', 'paid_by', 'expense')
    
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"User {user.id} balance check: Found {shares_qs.count()} unsettled shares")
    
    if group_id:
        shares_qs = shares_qs.filter(expense__group_id=group_id)
    
    # Calculate direct totals first (before debt simplification)
    total_you_owe = Decimal('0')
    total_owed_to_you = Decimal('0')
    
    # Calculate balances per user
    balances = defaultdict(lambda: {'owed': Decimal('0'), 'owes': Decimal('0')})
    
    # Debug: track share details
    share_details = []
    
    for share in shares_qs:
        share_user_id = share.user_id
        share_paid_by_id = share.paid_by_id
        current_user_id = user.id
        
        share_info = {
            'share_id': str(share.id),
            'user_id': share_user_id,
            'paid_by_id': share_paid_by_id,
            'amount': float(share.amount),
            'expense_title': share.expense.title if share.expense else 'Unknown',
        }
        
        if share_user_id == current_user_id:
            # This is current user's share
            if share_paid_by_id != current_user_id:
                # Someone else paid for user's share - user owes them
                balances[share_paid_by_id]['owed'] += share.amount
                total_you_owe += share.amount
                share_info['category'] = 'you_owe'
            else:
                share_info['category'] = 'self_paid'
        elif share_paid_by_id == current_user_id:
            # User paid for someone else's share - they owe user
            balances[share_user_id]['owes'] += share.amount
            total_owed_to_you += share.amount
            share_info['category'] = 'owed_to_you'
        else:
            share_info['category'] = 'not_related'
        
        share_details.append(share_info)
    
    # Calculate net balances for each user
    net_balances = {}
    for other_user_id, amounts in balances.items():
        net = amounts['owes'] - amounts['owed']
        if abs(net) > Decimal('0.01'):  # Only include significant amounts
            net_balances[str(other_user_id)] = net
    
    # Use advanced debt simplification for detailed breakdown
    simplified_transactions = DebtSimplifier.minimize_transactions(net_balances)
    
    simplified_balances = []
    for txn in simplified_transactions:
        from_user_id = txn['from']
        to_user_id = txn['to']
        amount = txn['amount']
        
        # Determine if this affects the current user
        if from_user_id == str(user.id):
            # User owes someone
            try:
                to_user = User.objects.get(id=to_user_id)
                simplified_balances.append({
                    'user_id': to_user_id,
                    'user_name': to_user.get_full_name() or to_user.username,
                    'amount': float(amount),
                    'currency': 'USD',
                    'you_owe': True,
                    'owes_you': False
                })
            except User.DoesNotExist:
                pass
        elif to_user_id == str(user.id):
            # Someone owes user
            try:
                from_user = User.objects.get(id=from_user_id)
                simplified_balances.append({
                    'user_id': from_user_id,
                    'user_name': from_user.get_full_name() or from_user.username,
                    'amount': float(amount),
                    'currency': 'USD',
                    'you_owe': False,
                    'owes_you': True
                })
            except User.DoesNotExist:
                pass
    
    # Also include simplified transactions for reference
    transactions_with_names = []
    for txn in simplified_transactions:
        try:
            from_user = User.objects.get(id=txn['from'])
            to_user = User.objects.get(id=txn['to'])
            transactions_with_names.append({
                'from_user_id': txn['from'],
                'from_user_name': from_user.get_full_name() or from_user.username,
                'to_user_id': txn['to'],
                'to_user_name': to_user.get_full_name() or to_user.username,
                'amount': float(txn['amount']),
                'currency': 'USD'
            })
        except User.DoesNotExist:
            continue
    
    # Return both the direct totals AND the simplified balances
    # Direct totals show the raw amounts before debt simplification
    return Response({
        'balances': simplified_balances,
        'simplified_transactions': transactions_with_names,
        'total_owed': float(total_you_owe),
        'total_owed_to_you': float(total_owed_to_you),
        # Include raw balances for debugging (can be removed in production)
        'debug_info': {
            'user_id': user.id,
            'shares_count': len(share_details),
            'raw_you_owe': float(total_you_owe),
            'raw_owed_to_you': float(total_owed_to_you),
            'share_details': share_details[:10],  # Limit to first 10 for debugging
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def group_balances(request, group_id):
    """Get balances for a specific group"""
    user = request.user
    
    try:
        group = Group.objects.get(id=group_id)
        if not group.memberships.filter(user=user, is_active=True).exists():
            return Response(
                {'detail': 'You are not a member of this group'},
                status=status.HTTP_403_FORBIDDEN
            )
    except Group.DoesNotExist:
        return Response(
            {'detail': 'Group not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Get all expense shares for this group
    shares = ExpenseShare.objects.filter(
        expense__group_id=group_id,
        is_settled=False
    ).select_related('user', 'paid_by')
    
    # Calculate net balances for each user
    # Positive = owes money, Negative = is owed money
    net_balances = defaultdict(lambda: Decimal('0'))
    
    for share in shares:
        if share.paid_by != share.user:
            # User owes money to paid_by
            net_balances[str(share.user.id)] += share.amount
            # paid_by is owed money
            net_balances[str(share.paid_by.id)] -= share.amount
    
    # Filter out zero balances
    net_balances = {
        user_id: balance
        for user_id, balance in net_balances.items()
        if abs(balance) > Decimal('0.01')
    }
    
    # Use advanced debt simplification
    simplified_transactions = DebtSimplifier.minimize_transactions(net_balances)
    
    # Convert to user-friendly format
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    simplified = []
    for txn in simplified_transactions:
        try:
            from_user = User.objects.get(id=txn['from'])
            to_user = User.objects.get(id=txn['to'])
            simplified.append({
                'from_user_id': txn['from'],
                'from_user_name': from_user.get_full_name() or from_user.username,
                'to_user_id': txn['to'],
                'to_user_name': to_user.get_full_name() or to_user.username,
                'amount': txn['amount'],
                'currency': 'USD'  # TODO: Handle multiple currencies
            })
        except User.DoesNotExist:
            continue
    
    return Response({
        'group_id': group_id,
        'group_name': group.name,
        'balances': simplified,
        'transaction_count': len(simplified),
        'original_transaction_count': len(shares)  # For comparison
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_settlement(request):
    """Create a new settlement"""
    serializer = SettlementSerializer(data=request.data)
    if serializer.is_valid():
        # Set payer to current user if not specified
        if 'payer_id' not in serializer.validated_data:
            serializer.validated_data['payer'] = request.user
        else:
            # Verify payer is current user
            if serializer.validated_data.get('payer_id') != request.user.id:
                return Response(
                    {'detail': 'You can only create settlements where you are the payer'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        settlement = serializer.save()
        return Response(SettlementSerializer(settlement).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
