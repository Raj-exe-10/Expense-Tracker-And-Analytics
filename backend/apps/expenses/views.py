from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Sum, Count, Avg
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
import logging

from .models import Expense, ExpenseShare, RecurringExpense, ExpenseComment
from .serializers import (
    ExpenseSerializer, ExpenseShareSerializer, 
    RecurringExpenseSerializer, ExpenseCommentSerializer
)
from .mixins import ExpenseFilterMixin
from apps.groups.models import Group, GroupMembership

logger = logging.getLogger(__name__)


class ExpenseViewSet(ExpenseFilterMixin, viewsets.ModelViewSet):
    """
    ViewSet for managing expenses.
    """
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]
    
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
        
        # Auto-create equal shares if group expense and no shares_data provided
        # The serializer's create method handles shares_data if provided
        if expense.group and not serializer.validated_data.get('shares_data'):
            self.create_equal_shares(expense)
        
        # Update group's total_expenses if this is a group expense
        if expense.group:
            try:
                expense.group.update_total_expenses()
            except Exception as e:
                logger.warning(f"Failed to update group total expenses: {e}")
        
        # Create notifications for relevant users
        try:
            from apps.notifications.services import NotificationService
            NotificationService.notify_expense_added(expense, self.request.user)
        except Exception as e:
            logger.warning(f"Failed to create expense notifications: {e}")
    
    def perform_update(self, serializer):
        expense = serializer.save()
        
        # Update group's total_expenses if this is a group expense
        if expense.group:
            try:
                expense.group.update_total_expenses()
            except Exception as e:
                logger.warning(f"Failed to update group total expenses: {e}")
        
        # Create notifications for relevant users
        try:
            from apps.notifications.services import NotificationService
            NotificationService.notify_expense_updated(expense, self.request.user)
        except Exception as e:
            logger.warning(f"Failed to create expense update notifications: {e}")
    
    def perform_destroy(self, instance):
        # Store group reference before deleting
        group = instance.group
        
        # Delete the expense
        instance.delete()
        
        # Update group's total_expenses if this was a group expense
        if group:
            try:
                group.update_total_expenses()
            except Exception as e:
                logger.warning(f"Failed to update group total expenses after deletion: {e}")
    
    def create_equal_shares(self, expense):
        """Create equal shares for all group members"""
        group_memberships = expense.group.memberships.filter(is_active=True)
        member_count = group_memberships.count()
        if member_count == 0:
            return
        
        share_amount = expense.amount / member_count
        
        for membership in group_memberships:
            ExpenseShare.objects.get_or_create(
                expense=expense,
                user=membership.user,
                defaults={
                    'amount': share_amount,
                    'currency': expense.currency,
                    'paid_by': expense.paid_by
                }
            )
    
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
        """Split expense equally among selected users"""
        expense = self.get_object()
        user_ids = request.data.get('user_ids', [])
        
        if not user_ids:
            return Response(
                {'error': 'No users provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Delete existing shares
        expense.shares.all().delete()
        
        # Create new equal shares
        share_amount = expense.amount / len(user_ids)
        for user_id in user_ids:
            ExpenseShare.objects.create(
                expense=expense,
                user_id=user_id,
                amount=share_amount,
                currency=expense.currency,
                paid_by=expense.paid_by
            )
        
        return Response({
            'message': 'Expense split equally',
            'shares': ExpenseShareSerializer(expense.shares.all(), many=True).data
        })
    
    @action(detail=True, methods=['post'])
    def split_by_amount(self, request, pk=None):
        """Split expense by specific amounts"""
        expense = self.get_object()
        
        # Authorization check
        if expense.paid_by != request.user:
            if not expense.group:
                return Response(
                    {'error': 'You do not have permission to modify this expense'},
                    status=status.HTTP_403_FORBIDDEN
                )
            membership = expense.group.memberships.filter(
                user=request.user,
                is_active=True
            ).first()
            if not membership:
                return Response(
                    {'error': 'You are not a member of this group'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        shares_data = request.data.get('shares', [])
        
        if not shares_data:
            return Response(
                {'error': 'No share data provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        total_amount = sum(share['amount'] for share in shares_data)
        if abs(total_amount - float(expense.amount)) > 0.01:
            return Response(
                {'error': 'Share amounts do not match expense total'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Delete existing shares
        expense.shares.all().delete()
        
        # Create new shares
        for share_data in shares_data:
            ExpenseShare.objects.create(
                expense=expense,
                user_id=share_data['user_id'],
                amount=share_data['amount'],
                currency=expense.currency,
                paid_by=expense.paid_by
            )
        
        return Response({
            'message': 'Expense split by amounts',
            'shares': ExpenseShareSerializer(expense.shares.all(), many=True).data
        })
    
    @action(detail=True, methods=['post'])
    def split_by_percentage(self, request, pk=None):
        """Split expense by percentages"""
        expense = self.get_object()
        shares_data = request.data.get('shares', [])
        
        if not shares_data:
            return Response(
                {'error': 'No share data provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        total_percentage = sum(share['percentage'] for share in shares_data)
        if abs(total_percentage - 100) > 0.01:
            return Response(
                {'error': 'Percentages do not add up to 100%'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Delete existing shares
        expense.shares.all().delete()
        
        # Create new shares
        for share_data in shares_data:
            percentage = Decimal(share_data['percentage'])
            ExpenseShare.objects.create(
                expense=expense,
                user_id=share_data['user_id'],
                amount=(expense.amount * percentage) / 100,
                currency=expense.currency,
                paid_by=expense.paid_by
            )
        
        return Response({
            'message': 'Expense split by percentages',
            'shares': ExpenseShareSerializer(expense.shares.all(), many=True).data
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
            'total_expenses': float(expenses['total_expenses'] or 0),
            'expense_count': expenses['expense_count'] or 0,
            'average_expense': float(expenses['average_expense'] or 0),
            'by_category': list(category_stats),
            'by_group': list(group_stats),
            'daily_expenses': [
                {'date': item['expense_date'].isoformat(), 'total': float(item['total'])}
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
            balances[creator_id]['you_owe'] = float(share['total_owed'])
        
        # Calculate net balances
        for user_id in balances:
            balances[user_id]['net_balance'] = (
                balances[user_id]['owes_you'] - balances[user_id]['you_owe']
            )
        
        return Response(list(balances.values()))
