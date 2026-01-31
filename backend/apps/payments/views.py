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
    
    @action(detail=True, methods=['post'])
    def send_reminder(self, request, pk=None):
        """Send a reminder to the payer"""
        settlement = self.get_object()
        
        # Only the payee (person owed money) can send reminders
        if settlement.payee != request.user:
            return Response(
                {'detail': 'Only the payee can send reminders'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if settlement.status == 'completed':
            return Response(
                {'detail': 'This settlement is already completed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create notification for the payer
        from apps.notifications.services import NotificationService
        NotificationService.create_notification(
            user=settlement.payer,
            notification_type='payment_reminder',
            title='Payment Reminder',
            message=f'{request.user.get_full_name() or request.user.username} sent you a reminder to settle ${settlement.amount}',
            sender=request.user,
            related_object_type='settlement',
            related_object_id=settlement.id,
            action_url='/settlements',
            metadata={
                'settlement_id': str(settlement.id),
                'amount': str(settlement.amount),
                'payee_name': request.user.get_full_name() or request.user.username,
            }
        )
        
        return Response({
            'detail': 'Reminder sent successfully',
            'settlement': SettlementSerializer(settlement).data
        })
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject/dispute a settlement"""
        settlement = self.get_object()
        reason = request.data.get('reason', '')
        
        if request.user not in [settlement.payer, settlement.payee]:
            return Response(
                {'detail': 'You are not authorized to reject this settlement'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        settlement.status = 'disputed'
        settlement.notes = f"Disputed by {request.user.get_full_name()}: {reason}"
        settlement.save()
        
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
    
    # Use advanced debt simplification for optimized transactions
    simplified_transactions = DebtSimplifier.minimize_transactions(net_balances)
    
    # Build the raw per-user balances (what the user actually sees)
    raw_balances = []
    for other_user_id, amounts in balances.items():
        try:
            other_user = User.objects.get(id=other_user_id)
            user_name = other_user.get_full_name() or other_user.username
            
            # User owes this person
            if amounts['owed'] > Decimal('0.01'):
                raw_balances.append({
                    'user_id': str(other_user_id),
                    'user_name': user_name,
                    'amount': float(amounts['owed']),
                    'currency': 'USD',
                    'you_owe': True,
                    'owes_you': False
                })
            
            # This person owes the user
            if amounts['owes'] > Decimal('0.01'):
                raw_balances.append({
                    'user_id': str(other_user_id),
                    'user_name': user_name,
                    'amount': float(amounts['owes']),
                    'currency': 'USD',
                    'you_owe': False,
                    'owes_you': True
                })
        except User.DoesNotExist:
            continue
    
    # Also include simplified transactions for reference (optimized payment plan)
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
    
    # Return both the direct totals AND the raw balances
    return Response({
        'balances': raw_balances,
        'simplified_transactions': transactions_with_names,
        'total_owed': float(total_you_owe),
        'total_owed_to_you': float(total_owed_to_you),
        # Include debug info (can be removed in production)
        'debug_info': {
            'user_id': user.id,
            'shares_count': len(share_details),
            'raw_you_owe': float(total_you_owe),
            'raw_owed_to_you': float(total_owed_to_you),
            'net_balances': {k: float(v) for k, v in net_balances.items()},
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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def quick_settle(request):
    """Quick settle - create settlement and optionally complete immediately"""
    user = request.user
    payee_id = request.data.get('payee_id')
    amount = request.data.get('amount')
    payment_method = request.data.get('payment_method', 'cash')
    note = request.data.get('note', '')
    group_id = request.data.get('group_id')
    complete_immediately = request.data.get('complete_immediately', False)
    
    if not payee_id or not amount:
        return Response(
            {'detail': 'payee_id and amount are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    try:
        payee = User.objects.get(id=payee_id)
    except User.DoesNotExist:
        return Response(
            {'detail': 'Payee not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Get default currency
    default_currency = Currency.objects.filter(code='USD').first() or Currency.objects.first()
    if not default_currency:
        return Response(
            {'detail': 'No currency configured'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    # Create settlement
    settlement_data = {
        'payer': user,
        'payee': payee,
        'amount': Decimal(str(amount)),
        'currency': default_currency,
        'payment_service': payment_method,
        'notes': note,
        'status': 'completed' if complete_immediately else 'pending',
    }
    
    if group_id:
        try:
            group = Group.objects.get(id=group_id)
            settlement_data['group'] = group
        except Group.DoesNotExist:
            pass
    
    settlement = Settlement.objects.create(**settlement_data)
    
    if complete_immediately:
        settlement.mark_as_completed()
    
    # Send notification to payee
    from apps.notifications.services import NotificationService
    if complete_immediately:
        NotificationService.create_notification(
            user=payee,
            notification_type='settlement_completed',
            title='Payment Received',
            message=f'{user.get_full_name() or user.username} has settled ${amount} with you',
            sender=user,
            related_object_type='settlement',
            related_object_id=settlement.id,
            action_url='/settlements',
            metadata={'settlement_id': str(settlement.id)}
        )
    else:
        NotificationService.create_notification(
            user=payee,
            notification_type='settlement_created',
            title='New Settlement Request',
            message=f'{user.get_full_name() or user.username} wants to settle ${amount} with you',
            sender=user,
            related_object_type='settlement',
            related_object_id=settlement.id,
            action_url='/settlements',
            metadata={'settlement_id': str(settlement.id)}
        )
    
    return Response(SettlementSerializer(settlement).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def expense_settlements(request):
    """Get all expense-based settlements (pending and completed) for the user"""
    user = request.user
    status_filter = request.query_params.get('status', 'all')  # all, pending, completed
    
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    # Get expense shares where user is involved
    shares_qs = ExpenseShare.objects.filter(
        Q(user=user) | Q(paid_by=user)
    ).select_related(
        'user', 'paid_by', 'expense', 'expense__group', 'expense__currency'
    ).order_by('-expense__expense_date', '-created_at')
    
    # Filter by status
    if status_filter == 'pending':
        shares_qs = shares_qs.filter(is_settled=False)
    elif status_filter == 'completed':
        shares_qs = shares_qs.filter(is_settled=True)
    
    settlements = []
    for share in shares_qs:
        # Skip if user paid for their own share (no settlement needed)
        if share.user_id == share.paid_by_id:
            continue
        
        is_payer = share.paid_by_id == user.id
        other_user = share.user if is_payer else share.paid_by
        
        settlements.append({
            'id': str(share.id),
            'type': 'expense_share',
            'expense_id': str(share.expense.id) if share.expense else None,
            'expense_title': share.expense.title if share.expense else 'Unknown',
            'expense_date': share.expense.expense_date.isoformat() if share.expense and share.expense.expense_date else None,
            'amount': float(share.amount),
            'currency': share.expense.currency.code if share.expense and share.expense.currency else 'USD',
            'currency_symbol': share.expense.currency.symbol if share.expense and share.expense.currency else '$',
            'status': 'completed' if share.is_settled else 'pending',
            'is_settled': share.is_settled,
            'settled_at': share.settled_at.isoformat() if share.settled_at else None,
            'group_id': str(share.expense.group.id) if share.expense and share.expense.group else None,
            'group_name': share.expense.group.name if share.expense and share.expense.group else None,
            'is_payer': is_payer,  # True if current user paid, False if current user owes
            'payer': {
                'id': share.paid_by.id,
                'name': share.paid_by.get_full_name() or share.paid_by.username,
                'email': share.paid_by.email,
            },
            'payee': {
                'id': share.user.id,
                'name': share.user.get_full_name() or share.user.username,
                'email': share.user.email,
            },
            'other_user': {
                'id': other_user.id,
                'name': other_user.get_full_name() or other_user.username,
                'email': other_user.email,
            },
            'created_at': share.created_at.isoformat() if share.created_at else None,
        })
    
    # Count by status
    pending_count = sum(1 for s in settlements if s['status'] == 'pending')
    completed_count = sum(1 for s in settlements if s['status'] == 'completed')
    
    return Response({
        'settlements': settlements,
        'counts': {
            'total': len(settlements),
            'pending': pending_count,
            'completed': completed_count,
        }
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def settle_expense_share(request, share_id):
    """Mark an expense share as settled"""
    user = request.user
    payment_method = request.data.get('payment_method', 'cash')
    note = request.data.get('note', '')
    
    try:
        share = ExpenseShare.objects.get(id=share_id)
    except ExpenseShare.DoesNotExist:
        return Response(
            {'detail': 'Expense share not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check if user is involved in this share
    if user.id not in [share.user_id, share.paid_by_id]:
        return Response(
            {'detail': 'You are not authorized to settle this expense'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    if share.is_settled:
        return Response(
            {'detail': 'This expense is already settled'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Mark as settled
    share.is_settled = True
    share.settled_at = timezone.now()
    share.save()
    
    # Send notification
    from apps.notifications.services import NotificationService
    other_user = share.paid_by if share.user_id == user.id else share.user
    NotificationService.create_notification(
        user=other_user,
        notification_type='settlement_completed',
        title='Payment Settled',
        message=f'{user.get_full_name() or user.username} marked ${share.amount} as settled for "{share.expense.title}"',
        sender=user,
        related_object_type='expense_share',
        related_object_id=share.id,
        action_url='/settlements',
        metadata={
            'share_id': str(share.id),
            'expense_id': str(share.expense.id) if share.expense else None,
        }
    )
    
    return Response({
        'detail': 'Expense settled successfully',
        'share_id': str(share.id),
        'is_settled': share.is_settled,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_reminder(request):
    """Send a payment reminder to a user"""
    user = request.user
    to_user_id = request.data.get('to_user_id')
    amount = request.data.get('amount')
    message = request.data.get('message', '')
    
    if not to_user_id:
        return Response(
            {'detail': 'to_user_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    try:
        to_user = User.objects.get(id=to_user_id)
    except User.DoesNotExist:
        return Response(
            {'detail': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Create notification
    from apps.notifications.services import NotificationService
    NotificationService.create_notification(
        user=to_user,
        notification_type='payment_reminder',
        title='Payment Reminder',
        message=f'{user.get_full_name() or user.username} is reminding you about a payment of ${amount or "pending amount"}. {message}',
        sender=user,
        action_url='/settlements',
        metadata={
            'from_user_id': str(user.id),
            'from_user_name': user.get_full_name() or user.username,
            'amount': str(amount) if amount else None,
        }
    )
    
    return Response({'detail': 'Reminder sent successfully'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def transaction_history(request):
    """Get all transactions (expense shares) for the user - both settled and unsettled"""
    user = request.user
    status_filter = request.query_params.get('status', 'all')  # all, settled, unsettled
    limit = int(request.query_params.get('limit', 50))
    
    # Get expense shares where user is involved
    shares_qs = ExpenseShare.objects.filter(
        Q(user=user) | Q(paid_by=user)
    ).select_related(
        'user', 'paid_by', 'expense', 'expense__group', 'expense__category'
    ).order_by('-expense__expense_date', '-created_at')
    
    if status_filter == 'settled':
        shares_qs = shares_qs.filter(is_settled=True)
    elif status_filter == 'unsettled':
        shares_qs = shares_qs.filter(is_settled=False)
    
    shares_qs = shares_qs[:limit]
    
    transactions = []
    for share in shares_qs:
        is_payer = share.paid_by_id == user.id
        other_user = share.user if is_payer else share.paid_by
        
        # Skip if user paid for their own share
        if share.user_id == share.paid_by_id:
            continue
        
        transactions.append({
            'id': str(share.id),
            'expense_id': str(share.expense.id) if share.expense else None,
            'expense_title': share.expense.title if share.expense else 'Unknown',
            'expense_date': share.expense.expense_date.isoformat() if share.expense and share.expense.expense_date else None,
            'group_id': str(share.expense.group.id) if share.expense and share.expense.group else None,
            'group_name': share.expense.group.name if share.expense and share.expense.group else None,
            'category': share.expense.category.name if share.expense and share.expense.category else None,
            'amount': float(share.amount),
            'currency': 'USD',
            'is_settled': share.is_settled,
            'settled_at': share.settled_at.isoformat() if share.settled_at else None,
            'type': 'owed_to_you' if is_payer else 'you_owe',
            'other_user': {
                'id': other_user.id,
                'name': other_user.get_full_name() or other_user.username,
                'email': other_user.email,
            }
        })
    
    # Also get formal settlements
    settlements = Settlement.objects.filter(
        Q(payer=user) | Q(payee=user)
    ).select_related('payer', 'payee', 'group', 'currency').order_by('-created_at')[:limit]
    
    settlement_history = []
    
    # Add formal settlements
    for s in settlements:
        is_payer = s.payer_id == user.id
        other_user = s.payee if is_payer else s.payer
        
        settlement_history.append({
            'id': str(s.id),
            'type': 'settlement',
            'amount': float(s.amount),
            'currency': s.currency.code if s.currency else 'USD',
            'status': s.status,
            'payment_method': s.payment_service or 'manual',
            'created_at': s.created_at.isoformat() if s.created_at else None,
            'completed_at': s.completed_at.isoformat() if s.completed_at else None,
            'group_name': s.group.name if s.group else None,
            'is_payer': is_payer,
            'other_user': {
                'id': other_user.id,
                'name': other_user.get_full_name() or other_user.username,
            },
            'notes': s.notes,
        })
    
    # Add settled expense shares as settlement history
    settled_shares = ExpenseShare.objects.filter(
        Q(user=user) | Q(paid_by=user),
        is_settled=True
    ).select_related(
        'user', 'paid_by', 'expense', 'expense__group'
    ).order_by('-settled_at', '-created_at')[:limit]
    
    for share in settled_shares:
        # Skip if user paid for their own share
        if share.user_id == share.paid_by_id:
            continue
        
        is_payer = share.paid_by_id == user.id
        other_user = share.user if is_payer else share.paid_by
        
        settlement_history.append({
            'id': str(share.id),
            'type': 'expense_settlement',
            'amount': float(share.amount),
            'currency': 'USD',
            'status': 'completed',
            'payment_method': 'expense_share',
            'created_at': share.created_at.isoformat() if share.created_at else None,
            'completed_at': share.settled_at.isoformat() if share.settled_at else None,
            'group_name': share.expense.group.name if share.expense and share.expense.group else None,
            'expense_title': share.expense.title if share.expense else 'Unknown',
            'is_payer': is_payer,
            'other_user': {
                'id': other_user.id,
                'name': other_user.get_full_name() or other_user.username,
            },
            'notes': f'Settled for expense: {share.expense.title}' if share.expense else None,
        })
    
    # Sort settlement history by completed_at/created_at date (most recent first)
    settlement_history.sort(
        key=lambda x: x.get('completed_at') or x.get('created_at') or '',
        reverse=True
    )
    
    return Response({
        'transactions': transactions,
        'settlements': settlement_history,
    })
