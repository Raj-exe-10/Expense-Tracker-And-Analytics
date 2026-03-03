from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Sum, Count, Avg
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal, ROUND_DOWN
import logging

from .models import Expense, ExpenseShare, RecurringExpense, ExpenseComment
from .serializers import (
    ExpenseSerializer, SimpleExpenseSerializer, ExpenseShareSerializer,
    RecurringExpenseSerializer, ExpenseCommentSerializer
)
from .mixins import ExpenseFilterMixin
from .services import ExpenseService
from apps.groups.models import Group, GroupMembership

logger = logging.getLogger(__name__)


def _validate_split_user_ids(expense, user_ids):
    """Return the set of valid active-member user IDs, or an error Response.

    For group expenses every supplied user_id must belong to an active member
    of the group.  For individual expenses the only valid user is the payer.
    Returns (valid_ids: set | None, error_response: Response | None).
    """
    if expense.group:
        active_member_ids = set(
            expense.group.memberships
            .filter(is_active=True)
            .values_list('user_id', flat=True)
        )
        # Normalise to comparable types (both as strings)
        submitted = {str(uid) for uid in user_ids}
        valid = {str(uid) for uid in active_member_ids}
        invalid = submitted - valid
        if invalid:
            return None, Response(
                {'error': f'The following user IDs are not active members of the group: {sorted(invalid)}'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return active_member_ids, None

    # Individual expense — only the payer
    allowed = {str(expense.paid_by_id)}
    submitted = {str(uid) for uid in user_ids}
    invalid = submitted - allowed
    if invalid:
        return None, Response(
            {'error': 'Non-group expenses can only have shares for the payer'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    return {expense.paid_by_id}, None


class ExpenseViewSet(ExpenseFilterMixin, viewsets.ModelViewSet):
    """
    ViewSet for managing expenses.
    """
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return SimpleExpenseSerializer
        return ExpenseSerializer

    def get_queryset(self):
        """Get queryset with security-validated filters"""
        queryset = self.get_base_expense_queryset(self.request.user)
        return self.apply_expense_filters(queryset, self.request)
    
    def create(self, request, *args, **kwargs):
        """Override create to log validation errors"""
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            logger.error(f"Expense creation validation failed: {serializer.errors}")
            logger.error(f"Request data: {request.data}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        return super().create(request, *args, **kwargs)
    
    def perform_create(self, serializer):
        expense = serializer.save(paid_by=self.request.user)
        ExpenseService.after_create(
            expense,
            serializer.validated_data,
            self.request.user,
        )

    def perform_update(self, serializer):
        expense = serializer.save()
        ExpenseService.after_update(expense, self.request.user)

    def perform_destroy(self, instance):
        group = instance.group
        instance.delete()
        ExpenseService.after_destroy(group)
    
    @action(detail=True, methods=['post'])
    def settle(self, request, pk=None):
        """Mark expense as settled"""
        expense = self.get_object()
        
        # Authorization check
        if expense.paid_by != request.user and not expense.group:
            return Response(
                {'error': 'You do not have permission to settle this expense'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Group expense authorization
        if expense.group:
            membership = expense.group.memberships.filter(
                user=request.user,
                is_active=True
            ).first()
            if not membership:
                return Response(
                    {'error': 'You are not a member of this group'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        expense.is_settled = True
        expense.save()
        
        # Mark all shares as settled
        expense.shares.update(is_settled=True, settled_at=timezone.now())
        
        return Response({
            'message': 'Expense marked as settled',
            'expense': ExpenseSerializer(expense).data
        })
    
    @action(detail=True, methods=['post'])
    def split_equally(self, request, pk=None):
        """Split expense equally among selected users."""
        expense = self.get_object()
        user_ids = request.data.get('user_ids', [])

        if not user_ids:
            return Response(
                {'error': 'No users provided'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --- IDOR prevention: every user_id must be an active group member ---
        _, err = _validate_split_user_ids(expense, user_ids)
        if err:
            return err

        count = len(user_ids)
        base_amount = (expense.amount / count).quantize(Decimal('0.01'), rounding=ROUND_DOWN)
        remainder = expense.amount - (base_amount * count)

        expense.shares.all().delete()

        for idx, user_id in enumerate(user_ids):
            share_amount = base_amount + (remainder if idx == 0 else Decimal('0'))
            ExpenseShare.objects.create(
                expense=expense,
                user_id=user_id,
                amount=share_amount,
                currency=expense.currency,
                paid_by=expense.paid_by,
            )

        return Response({
            'message': 'Expense split equally',
            'shares': ExpenseShareSerializer(expense.shares.all(), many=True).data,
        })
    
    @action(detail=True, methods=['post'])
    def split_by_amount(self, request, pk=None):
        """Split expense by specific amounts."""
        expense = self.get_object()

        # Authorization: only the payer or a group member can modify splits
        if expense.paid_by != request.user:
            if not expense.group:
                return Response(
                    {'error': 'You do not have permission to modify this expense'},
                    status=status.HTTP_403_FORBIDDEN,
                )
            if not expense.group.memberships.filter(user=request.user, is_active=True).exists():
                return Response(
                    {'error': 'You are not a member of this group'},
                    status=status.HTTP_403_FORBIDDEN,
                )

        shares_data = request.data.get('shares', [])
        if not shares_data:
            return Response(
                {'error': 'No share data provided'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --- IDOR prevention ---
        submitted_user_ids = [s['user_id'] for s in shares_data]
        _, err = _validate_split_user_ids(expense, submitted_user_ids)
        if err:
            return err

        total_amount = sum(Decimal(str(s['amount'])) for s in shares_data)
        if abs(total_amount - expense.amount) >= Decimal('0.01'):
            return Response(
                {'error': 'Share amounts do not match expense total'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        expense.shares.all().delete()

        for share_data in shares_data:
            ExpenseShare.objects.create(
                expense=expense,
                user_id=share_data['user_id'],
                amount=Decimal(str(share_data['amount'])),
                currency=expense.currency,
                paid_by=expense.paid_by,
            )

        return Response({
            'message': 'Expense split by amounts',
            'shares': ExpenseShareSerializer(expense.shares.all(), many=True).data,
        })
    
    @action(detail=True, methods=['post'])
    def split_by_percentage(self, request, pk=None):
        """Split expense by percentages."""
        expense = self.get_object()
        shares_data = request.data.get('shares', [])

        if not shares_data:
            return Response(
                {'error': 'No share data provided'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --- IDOR prevention ---
        submitted_user_ids = [s['user_id'] for s in shares_data]
        _, err = _validate_split_user_ids(expense, submitted_user_ids)
        if err:
            return err

        total_percentage = sum(Decimal(str(s['percentage'])) for s in shares_data)
        if abs(total_percentage - Decimal('100')) >= Decimal('0.01'):
            return Response(
                {'error': 'Percentages do not add up to 100%'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        expense.shares.all().delete()

        # Compute per-share amounts with remainder correction
        computed_shares = []
        running_total = Decimal('0')
        for i, share_data in enumerate(shares_data):
            percentage = Decimal(str(share_data['percentage']))
            raw = (expense.amount * percentage / 100).quantize(Decimal('0.01'), rounding=ROUND_DOWN)
            computed_shares.append((share_data['user_id'], raw))
            running_total += raw

        # Assign any rounding remainder to the first share
        remainder = expense.amount - running_total
        if remainder != Decimal('0') and computed_shares:
            uid, amt = computed_shares[0]
            computed_shares[0] = (uid, amt + remainder)

        for user_id, amount in computed_shares:
            ExpenseShare.objects.create(
                expense=expense,
                user_id=user_id,
                amount=amount,
                currency=expense.currency,
                paid_by=expense.paid_by,
            )

        return Response({
            'message': 'Expense split by percentages',
            'shares': ExpenseShareSerializer(expense.shares.all(), many=True).data,
        })
    
    @action(detail=False)
    def statistics(self, request):
        """Get expense statistics for the current user - optimized version"""
        user = request.user
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now() - timedelta(days=days)
        
        # Single optimized query with annotations
        expenses_qs = Expense.objects.filter(
            Q(paid_by=user) | Q(shares__user=user),
            expense_date__gte=start_date
        ).select_related('category', 'group').distinct()
        
        # Calculate statistics in single query
        expenses = expenses_qs.aggregate(
            total_expenses=Sum('amount'),
            expense_count=Count('id'),
            average_expense=Avg('amount')
        )
        
        # Category breakdown in single query
        category_stats = expenses_qs.values('category__id', 'category__name').annotate(
            total=Sum('amount'),
            count=Count('id')
        ).order_by('-total')[:5]
        
        # Group breakdown
        group_stats = expenses_qs.filter(group__isnull=False).values('group__id', 'group__name').annotate(
            total=Sum('amount'),
            count=Count('id')
        ).order_by('-total')[:5]
        
        # Daily expenses - optimized with single query
        daily_expenses = expenses_qs.values('expense_date').annotate(
            total=Sum('amount')
        ).order_by('expense_date')
        
        stats = {
            'total_expenses': (expenses['total_expenses'] or Decimal('0')),
            'expense_count': expenses['expense_count'] or 0,
            'average_expense': (expenses['average_expense'] or Decimal('0')),
            'by_category': list(category_stats),
            'by_group': list(group_stats),
            'daily_expenses': [
                {'date': item['expense_date'].isoformat(), 'total': (item['total'] or Decimal('0'))}
                for item in daily_expenses
            ]
        }
        
        return Response(stats)
    
    @action(detail=True, methods=['get'])
    def comments(self, request, pk=None):
        """Get comments for an expense"""
        expense = self.get_object()
        comments = expense.comments.all().order_by('-created_at')
        serializer = ExpenseCommentSerializer(comments, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_comment(self, request, pk=None):
        """Add a comment to an expense"""
        expense = self.get_object()
        
        # Authorization check - user must have access to the expense
        has_access = (
            expense.paid_by == request.user or
            expense.shares.filter(user=request.user).exists() or
            (expense.group and expense.group.memberships.filter(
                user=request.user,
                is_active=True
            ).exists())
        )
        
        if not has_access:
            return Response(
                {'error': 'You do not have permission to comment on this expense'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        comment_text = request.data.get('comment', '').strip()
        if not comment_text:
            return Response(
                {'error': 'Comment cannot be empty'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        comment = ExpenseComment.objects.create(
            expense=expense,
            user=request.user,
            comment=comment_text
        )
        serializer = ExpenseCommentSerializer(comment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class RecurringExpenseViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing recurring expenses.
    """
    serializer_class = RecurringExpenseSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return RecurringExpense.objects.filter(
            Q(paid_by=self.request.user) |
            Q(group__memberships__user=self.request.user, group__memberships__is_active=True)
        ).select_related(
            'paid_by',
            'category',
            'currency',
            'group',
            'created_by'
        ).distinct()
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, paid_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def pause(self, request, pk=None):
        """Pause a recurring expense"""
        recurring_expense = self.get_object()
        recurring_expense.is_active = False
        recurring_expense.save()
        return Response({'message': 'Recurring expense paused'})
    
    @action(detail=True, methods=['post'])
    def resume(self, request, pk=None):
        """Resume a recurring expense"""
        recurring_expense = self.get_object()
        recurring_expense.is_active = True
        recurring_expense.save()
        return Response({'message': 'Recurring expense resumed'})
    
    @action(detail=True, methods=['post'])
    def create_next_expense(self, request, pk=None):
        """Manually create the next expense from a recurring expense"""
        recurring_expense = self.get_object()
        
        # Create the expense
        expense = Expense.objects.create(
            title=recurring_expense.title,
            amount=recurring_expense.amount,
            currency=recurring_expense.currency,
            category=recurring_expense.category,
            group=recurring_expense.group,
            expense_date=timezone.now().date(),
            paid_by=recurring_expense.paid_by,
            split_type=recurring_expense.split_type,
            split_data=recurring_expense.split_data,
            description=f"{recurring_expense.description or recurring_expense.title} (Created from recurring expense)"
        )
        
        # Update last generated date
        recurring_expense.last_generated = timezone.now().date()
        recurring_expense.save()
        
        return Response({
            'message': 'Expense created from recurring expense',
            'expense': ExpenseSerializer(expense).data
        })
    
    @action(detail=False, methods=['post'])
    def process_all(self, request):
        """Process all active recurring expenses (usually called by a scheduled task)"""
        processed_count = 0
        today = timezone.now().date()
        
        recurring_expenses = RecurringExpense.objects.filter(
            is_active=True,
            start_date__lte=today
        ).filter(
            Q(end_date__isnull=True) | Q(end_date__gte=today)
        )
        
        for recurring in recurring_expenses:
            if recurring.should_create_expense():
                expense = Expense.objects.create(
                    title=recurring.title,
                    amount=recurring.amount,
                    currency=recurring.currency,
                    category=recurring.category,
                    group=recurring.group,
                    expense_date=today,
                    paid_by=recurring.paid_by,
                    split_type=recurring.split_type,
                    split_data=recurring.split_data,
                    description=f"{recurring.description or recurring.title} (Auto-generated from recurring expense)"
                )
                
                recurring.last_generated = today
                recurring.save()
                processed_count += 1
        
        return Response({
            'message': f'Processed {processed_count} recurring expenses',
            'count': processed_count
        })


class ExpenseShareViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing expense shares.
    """
    serializer_class = ExpenseShareSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return ExpenseShare.objects.filter(
            Q(expense__paid_by=self.request.user) |
            Q(user=self.request.user)
        ).distinct()
    
    @action(detail=False)
    def my_shares(self, request):
        """Get all shares for the current user"""
        shares = ExpenseShare.objects.filter(
            user=request.user,
            is_settled=False
        ).select_related(
            'expense',
            'user',
            'paid_by',
            'currency'
        ).order_by('-expense__expense_date')
        
        serializer = self.get_serializer(shares, many=True)
        return Response(serializer.data)
    
    @action(detail=False)
    def balances(self, request):
        """Get balance summary for the current user - optimized version"""
        user = request.user
        
        # Optimized query to get what others owe the user
        expenses_created = Expense.objects.filter(
            paid_by=user,
            is_settled=False
        ).prefetch_related('shares__user')
        
        # Calculate what others owe the user using aggregation
        shares_owed_to_user = ExpenseShare.objects.filter(
            expense__paid_by=user,
            expense__is_settled=False
        ).exclude(user=user).values('user__id', 'user__username').annotate(
            total_owed=Sum('amount')
        )
        
        # Calculate what the user owes others using aggregation
        shares_user_owes = ExpenseShare.objects.filter(
            user=user,
            is_settled=False
        ).exclude(expense__paid_by=user).values(
            'expense__paid_by__id',
            'expense__paid_by__username'
        ).annotate(
            total_owed=Sum('amount')
        )
        
        # Build balances dictionary
        balances = {}
        
        for share in shares_owed_to_user:
            user_id = share['user__id']
            if user_id not in balances:
                balances[user_id] = {
                    'user': share['user__username'],
                    'user_id': user_id,
                    'owes_you': 0,
                    'you_owe': 0,
                    'net_balance': 0
                }
            balances[user_id]['owes_you'] = float(share['total_owed'])
        
        for share in shares_user_owes:
            creator_id = share['expense__paid_by__id']
            if creator_id not in balances:
                balances[creator_id] = {
                    'user': share['expense__paid_by__username'],
                    'user_id': creator_id,
                    'owes_you': 0,
                    'you_owe': 0,
                    'net_balance': 0
                }
            balances[creator_id]['you_owe'] = Decimal(str(share['total_owed']))
        
        # Calculate net balances (Decimal math)
        for user_id in balances:
            balances[user_id]['net_balance'] = (
                balances[user_id]['owes_you'] - balances[user_id]['you_owe']
            )
        
        return Response(list(balances.values()))
