from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Avg, Q, F
from django.utils import timezone
from datetime import timedelta, datetime
from decimal import Decimal
from apps.expenses.models import Expense, ExpenseShare
from apps.groups.models import Group
from apps.core.models import Category, Currency
from .export_utils import generate_csv_export, generate_pdf_export


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """Get dashboard statistics"""
    user = request.user
    start_date = request.query_params.get('startDate')
    end_date = request.query_params.get('endDate')
    group_id = request.query_params.get('groupId')
    
    # Default to last 30 days if not provided
    if not end_date:
        end_date = timezone.now().date()
    else:
        end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
    
    if not start_date:
        start_date = end_date - timedelta(days=30)
    else:
        start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
    
    # Base queryset for user's expenses
    expenses_qs = Expense.objects.filter(
        Q(paid_by=user) | Q(shares__user=user),
        expense_date__gte=start_date,
        expense_date__lte=end_date
    ).distinct()
    
    if group_id:
        expenses_qs = expenses_qs.filter(group_id=group_id)
    
    # Calculate statistics
    total_expenses = expenses_qs.aggregate(
        total=Sum('amount')
    )['total'] or Decimal('0')
    
    expense_count = expenses_qs.count()
    avg_expense = expenses_qs.aggregate(
        avg=Avg('amount')
    )['avg'] or Decimal('0')
    
    # Previous period comparison
    period_days = (end_date - start_date).days
    prev_start = start_date - timedelta(days=period_days + 1)
    prev_end = start_date - timedelta(days=1)
    
    prev_expenses_qs = Expense.objects.filter(
        Q(paid_by=user) | Q(shares__user=user),
        expense_date__gte=prev_start,
        expense_date__lte=prev_end
    ).distinct()
    
    if group_id:
        prev_expenses_qs = prev_expenses_qs.filter(group_id=group_id)
    
    prev_total = prev_expenses_qs.aggregate(
        total=Sum('amount')
    )['total'] or Decimal('0')
    
    # Calculate percentage change
    if prev_total > 0:
        change_percentage = ((total_expenses - prev_total) / prev_total) * 100
    else:
        change_percentage = 100 if total_expenses > 0 else 0
    
    # Category breakdown
    category_stats = expenses_qs.values('category__name', 'category__id').annotate(
        total=Sum('amount'),
        count=Count('id')
    ).order_by('-total')[:10]
    
    # Daily expenses for trend
    daily_expenses = []
    current_date = start_date
    while current_date <= end_date:
        day_total = expenses_qs.filter(expense_date=current_date).aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0')
        
        daily_expenses.append({
            'date': current_date.isoformat(),
            'total': float(day_total)
        })
        current_date += timedelta(days=1)
    
    return Response({
        'total_expenses': float(total_expenses),
        'expense_count': expense_count,
        'average_expense': float(avg_expense),
        'change_percentage': float(change_percentage),
        'previous_period_total': float(prev_total),
        'category_breakdown': list(category_stats),
        'daily_expenses': daily_expenses,
        'period': {
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat()
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def expense_trends(request):
    """Get expense trends over time"""
    user = request.user
    start_date = request.query_params.get('startDate')
    end_date = request.query_params.get('endDate')
    group_id = request.query_params.get('groupId')
    
    if not end_date:
        end_date = timezone.now().date()
    else:
        end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
    
    if not start_date:
        start_date = end_date - timedelta(days=30)
    else:
        start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
    
    expenses_qs = Expense.objects.filter(
        Q(paid_by=user) | Q(shares__user=user),
        expense_date__gte=start_date,
        expense_date__lte=end_date
    ).distinct()
    
    if group_id:
        expenses_qs = expenses_qs.filter(group_id=group_id)
    
    # Group by date
    trends = expenses_qs.values('expense_date').annotate(
        amount=Sum('amount'),
        count=Count('id')
    ).order_by('expense_date')
    
    return Response({
        'trends': list(trends),
        'period': {
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat()
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def category_breakdown(request):
    """Get category breakdown"""
    user = request.user
    start_date = request.query_params.get('startDate')
    end_date = request.query_params.get('endDate')
    group_id = request.query_params.get('groupId')
    
    if not end_date:
        end_date = timezone.now().date()
    else:
        end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
    
    if not start_date:
        start_date = end_date - timedelta(days=30)
    else:
        start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
    
    expenses_qs = Expense.objects.filter(
        Q(paid_by=user) | Q(shares__user=user),
        expense_date__gte=start_date,
        expense_date__lte=end_date
    ).distinct()
    
    if group_id:
        expenses_qs = expenses_qs.filter(group_id=group_id)
    
    total = expenses_qs.aggregate(total=Sum('amount'))['total'] or Decimal('0')
    
    breakdown = expenses_qs.values(
        'category__id',
        'category__name',
        'category__color',
        'category__icon'
    ).annotate(
        amount=Sum('amount'),
        count=Count('id')
    ).order_by('-amount')
    
    # Calculate percentages
    result = []
    for item in breakdown:
        percentage = (item['amount'] / total * 100) if total > 0 else 0
        result.append({
            'category_id': item['category__id'],
            'category_name': item['category__name'],
            'color': item['category__color'],
            'icon': item['category__icon'],
            'amount': float(item['amount']),
            'count': item['count'],
            'percentage': float(percentage)
        })
    
    return Response({
        'breakdown': result,
        'total': float(total),
        'period': {
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat()
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def group_analytics(request, group_id):
    """Get analytics for a specific group"""
    user = request.user
    start_date = request.query_params.get('startDate')
    end_date = request.query_params.get('endDate')
    
    try:
        group = Group.objects.get(id=group_id)
        # Check if user is member
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
    
    if not end_date:
        end_date = timezone.now().date()
    else:
        end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
    
    if not start_date:
        start_date = end_date - timedelta(days=30)
    else:
        start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
    
    expenses_qs = Expense.objects.filter(
        group_id=group_id,
        expense_date__gte=start_date,
        expense_date__lte=end_date
    )
    
    total_expenses = expenses_qs.aggregate(total=Sum('amount'))['total'] or Decimal('0')
    expense_count = expenses_qs.count()
    
    # Member contributions
    member_stats = ExpenseShare.objects.filter(
        expense__group_id=group_id,
        expense__expense_date__gte=start_date,
        expense__expense_date__lte=end_date
    ).values('user__id', 'user__first_name', 'user__last_name').annotate(
        total_paid=Sum('amount', filter=Q(user=F('paid_by'))),
        total_owed=Sum('amount', filter=~Q(user=F('paid_by')))
    )
    
    # Category breakdown
    category_breakdown = expenses_qs.values('category__name').annotate(
        amount=Sum('amount'),
        count=Count('id')
    ).order_by('-amount')
    
    return Response({
        'group_id': group_id,
        'group_name': group.name,
        'total_expenses': float(total_expenses),
        'expense_count': expense_count,
        'member_stats': list(member_stats),
        'category_breakdown': list(category_breakdown),
        'period': {
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat()
        }
    })


from .export_utils import generate_csv_export, generate_pdf_export


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_data(request, format):
    """Export analytics data as CSV or PDF"""
    user = request.user
    start_date = request.query_params.get('startDate')
    end_date = request.query_params.get('endDate')
    group_id = request.query_params.get('groupId')
    
    # Default to last 30 days if not provided
    if not end_date:
        end_date = timezone.now().date()
    else:
        end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
    
    if not start_date:
        start_date = end_date - timedelta(days=30)
    else:
        start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
    
    # Get expenses data
    expenses_qs = Expense.objects.filter(
        Q(paid_by=user) | Q(shares__user=user),
        expense_date__gte=start_date,
        expense_date__lte=end_date
    ).distinct().select_related('category', 'currency', 'paid_by', 'group').prefetch_related('tags')
    
    if group_id:
        expenses_qs = expenses_qs.filter(group_id=group_id)
    
    expenses = list(expenses_qs.order_by('-expense_date'))
    
    if format.lower() == 'csv':
        return generate_csv_export(expenses, start_date, end_date, user)
    elif format.lower() == 'pdf':
        return generate_pdf_export(expenses, start_date, end_date, user)
    else:
        return Response(
            {'detail': f'Unsupported format: {format}. Use csv or pdf'},
            status=status.HTTP_400_BAD_REQUEST
        )
