from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Sum, Count, Avg
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal

from .models import Expense, ExpenseShare, RecurringExpense, ExpenseComment
from .serializers import (
    ExpenseSerializer, ExpenseShareSerializer, 
    RecurringExpenseSerializer, ExpenseCommentSerializer
)
from apps.groups.models import Group, GroupMembership


class ExpenseViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing expenses.
    """
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Expense.objects.filter(
            Q(paid_by=self.request.user) |
            Q(shares__user=self.request.user) |
            Q(group__members=self.request.user)
        ).distinct()
        
        # Filter by group
        group_id = self.request.query_params.get('group_id')
        if group_id:
            queryset = queryset.filter(group_id=group_id)
        
        # Filter by category
        category_id = self.request.query_params.get('category_id')
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        
        # Filter by payment status
        is_settled = self.request.query_params.get('is_settled')
        if is_settled is not None:
            queryset = queryset.filter(is_settled=is_settled.lower() == 'true')
        
        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(description__icontains=search) |
                Q(notes__icontains=search) |
                Q(tags__name__icontains=search)
            ).distinct()
        
        return queryset.order_by('-date', '-created_at')
    
    def perform_create(self, serializer):
        expense = serializer.save(paid_by=self.request.user)
        
        # Auto-create shares if group expense
        if expense.group:
            self.create_equal_shares(expense)
    
    def create_equal_shares(self, expense):
        """Create equal shares for all group members"""
        group_members = expense.group.members.all()
        share_amount = expense.amount / len(group_members)
        
        for member in group_members:
            ExpenseShare.objects.create(
                expense=expense,
                user=member,
                amount=share_amount,
                percentage=Decimal(100) / len(group_members)
            )
    
    @action(detail=True, methods=['post'])
    def settle(self, request, pk=None):
        """Mark expense as settled"""
        expense = self.get_object()
        expense.is_settled = True
        expense.settled_at = timezone.now()
        expense.save()
        
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
                percentage=Decimal(100) / len(user_ids)
            )
        
        return Response({
            'message': 'Expense split equally',
            'shares': ExpenseShareSerializer(expense.shares.all(), many=True).data
        })
    
    @action(detail=True, methods=['post'])
    def split_by_amount(self, request, pk=None):
        """Split expense by specific amounts"""
        expense = self.get_object()
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
                percentage=(Decimal(share_data['amount']) / expense.amount) * 100
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
                percentage=percentage,
                amount=(expense.amount * percentage) / 100
            )
        
        return Response({
            'message': 'Expense split by percentages',
            'shares': ExpenseShareSerializer(expense.shares.all(), many=True).data
        })
    
    @action(detail=False)
    def statistics(self, request):
        """Get expense statistics for the current user"""
        user = request.user
        
        # Date range
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now() - timedelta(days=days)
        
        # Base queryset
        expenses = Expense.objects.filter(
            Q(paid_by=user) | Q(shares__user=user)
        ).distinct()
        
        # Filter by date range
        expenses = expenses.filter(date__gte=start_date)
        
        # Calculate statistics
        stats = {
            'total_expenses': expenses.aggregate(Sum('amount'))['amount__sum'] or 0,
            'expense_count': expenses.count(),
            'average_expense': expenses.aggregate(Avg('amount'))['amount__avg'] or 0,
            'by_category': [],
            'by_group': [],
            'daily_expenses': [],
            'monthly_expenses': []
        }
        
        # By category
        category_stats = expenses.values('category__name').annotate(
            total=Sum('amount'),
            count=Count('id')
        ).order_by('-total')[:5]
        stats['by_category'] = list(category_stats)
        
        # By group
        group_stats = expenses.filter(group__isnull=False).values('group__name').annotate(
            total=Sum('amount'),
            count=Count('id')
        ).order_by('-total')[:5]
        stats['by_group'] = list(group_stats)
        
        # Daily expenses for the last 30 days
        for i in range(30):
            date = timezone.now().date() - timedelta(days=i)
            daily_total = expenses.filter(date=date).aggregate(Sum('amount'))['amount__sum'] or 0
            stats['daily_expenses'].append({
                'date': date.isoformat(),
                'total': float(daily_total)
            })
        
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
        comment = ExpenseComment.objects.create(
            expense=expense,
            user=request.user,
            comment=request.data.get('comment', '')
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
            Q(group__members=self.request.user)
        ).distinct()
    
    def perform_create(self, serializer):
        serializer.save(paid_by=self.request.user)
    
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
            description=recurring_expense.description,
            amount=recurring_expense.amount,
            currency=recurring_expense.currency,
            category=recurring_expense.category,
            group=recurring_expense.group,
            date=timezone.now().date(),
            paid_by=recurring_expense.paid_by,
            recurring_expense=recurring_expense,
            notes=f"Created from recurring expense: {recurring_expense.description}"
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
                    description=recurring.description,
                    amount=recurring.amount,
                    currency=recurring.currency,
                    category=recurring.category,
                    group=recurring.group,
                    date=today,
                    paid_by=recurring.paid_by,
                    recurring_expense=recurring,
                    notes=f"Auto-generated from recurring expense"
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
        ).order_by('-expense__date')
        
        serializer = self.get_serializer(shares, many=True)
        return Response(serializer.data)
    
    @action(detail=False)
    def balances(self, request):
        """Get balance summary for the current user"""
        user = request.user
        balances = {}
        
        # Calculate what others owe the user
        expenses_created = Expense.objects.filter(
            paid_by=user,
            is_settled=False
        )
        
        for expense in expenses_created:
            shares = expense.shares.exclude(user=user)
            for share in shares:
                if share.user.id not in balances:
                    balances[share.user.id] = {
                        'user': share.user.username,
                        'user_id': share.user.id,
                        'owes_you': 0,
                        'you_owe': 0,
                        'net_balance': 0
                    }
                balances[share.user.id]['owes_you'] += float(share.amount)
        
        # Calculate what the user owes others
        shares_owed = ExpenseShare.objects.filter(
            user=user,
            is_settled=False
        ).exclude(expense__paid_by=user)
        
        for share in shares_owed:
            creator_id = share.expense.paid_by.id
            if creator_id not in balances:
                balances[creator_id] = {
                    'user': share.expense.created_by.username,
                    'user_id': creator_id,
                    'owes_you': 0,
                    'you_owe': 0,
                    'net_balance': 0
                }
            balances[creator_id]['you_owe'] += float(share.amount)
        
        # Calculate net balances
        for user_id in balances:
            balances[user_id]['net_balance'] = (
                balances[user_id]['owes_you'] - balances[user_id]['you_owe']
            )
        
        return Response(list(balances.values()))
