from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Avg, Q, F, Subquery
from django.utils import timezone
from datetime import timedelta, datetime
from decimal import Decimal
from apps.expenses.models import Expense, ExpenseShare
from apps.groups.models import Group
from .export_utils import generate_csv_export, generate_pdf_export


def _parse_date_range(request):
    """Extract and parse startDate / endDate from query params."""
    raw_end = request.query_params.get('endDate')
    raw_start = request.query_params.get('startDate')

    end_date = (
        datetime.strptime(raw_end, '%Y-%m-%d').date()
        if raw_end else timezone.now().date()
    )
    start_date = (
        datetime.strptime(raw_start, '%Y-%m-%d').date()
        if raw_start else end_date - timedelta(days=30)
    )
    return start_date, end_date


def _user_expense_ids(user, start_date, end_date, group_id=None):
    """Return a subquery of distinct expense PKs the user is involved in.

    Using a subquery instead of a direct join avoids row multiplication
    when aggregating with Sum/Count — each expense is counted exactly once.
    """
    qs = Expense.objects.filter(
        Q(paid_by=user) | Q(shares__user=user),
        expense_date__gte=start_date,
        expense_date__lte=end_date,
    ).distinct()
    if group_id:
        qs = qs.filter(group_id=group_id)
    return qs.values('id')


def _user_expenses_qs(user, start_date, end_date, group_id=None):
    """Base queryset: expenses the user paid for or is a share-holder of.

    Returns a clean queryset with NO joins to expense_shares, so
    Sum('amount') counts each expense exactly once.
    """
    return Expense.objects.filter(
        id__in=Subquery(_user_expense_ids(user, start_date, end_date, group_id))
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """Get dashboard statistics.

    Optimised: all aggregates are computed with a single pass over the
    queryset, and the daily-trend uses one GROUP BY query instead of N
    separate queries (one per day).
    """
    user = request.user
    start_date, end_date = _parse_date_range(request)
    group_id = request.query_params.get('groupId')

    expenses_qs = _user_expenses_qs(user, start_date, end_date, group_id)

    # Single aggregate query for totals
    agg = expenses_qs.aggregate(
        total=Sum('amount'),
        count=Count('id'),
        avg=Avg('amount'),
    )
    total_expenses = agg['total'] or Decimal('0')
    expense_count = agg['count'] or 0
    avg_expense = agg['avg'] or Decimal('0')

    # Previous-period comparison (single aggregate)
    period_days = (end_date - start_date).days
    prev_start = start_date - timedelta(days=period_days + 1)
    prev_end = start_date - timedelta(days=1)

    prev_total = (
        _user_expenses_qs(user, prev_start, prev_end, group_id)
        .aggregate(total=Sum('amount'))['total']
    ) or Decimal('0')

    if prev_total > 0:
        change_percentage = ((total_expenses - prev_total) / prev_total) * 100
    else:
        change_percentage = Decimal('100') if total_expenses > 0 else Decimal('0')

    # Category breakdown (single GROUP BY)
    category_stats = (
        expenses_qs
        .values('category__name', 'category__id')
        .annotate(total=Sum('amount'), count=Count('id'))
        .order_by('-total')[:10]
    )

    # Daily trend — ONE query instead of N per-day queries
    daily_rows = (
        expenses_qs
        .values('expense_date')
        .annotate(total=Sum('amount'))
        .order_by('expense_date')
    )
    daily_map = {
        row['expense_date']: float(row['total'])
        for row in daily_rows
    }

    # Fill gaps so the frontend gets a contiguous series
    daily_expenses = []
    current_date = start_date
    while current_date <= end_date:
        daily_expenses.append({
            'date': current_date.isoformat(),
            'total': daily_map.get(current_date, 0.0),
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
            'end_date': end_date.isoformat(),
        },
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def expense_trends(request):
    """Get expense trends over time."""
    start_date, end_date = _parse_date_range(request)
    group_id = request.query_params.get('groupId')

    expenses_qs = _user_expenses_qs(request.user, start_date, end_date, group_id)

    trends = (
        expenses_qs
        .values('expense_date')
        .annotate(amount=Sum('amount'), count=Count('id'))
        .order_by('expense_date')
    )

    return Response({
        'trends': list(trends),
        'period': {
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
        },
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def category_breakdown(request):
    """Get category breakdown."""
    start_date, end_date = _parse_date_range(request)
    group_id = request.query_params.get('groupId')

    expenses_qs = _user_expenses_qs(request.user, start_date, end_date, group_id)

    total = expenses_qs.aggregate(total=Sum('amount'))['total'] or Decimal('0')

    breakdown = (
        expenses_qs
        .values('category__id', 'category__name', 'category__color', 'category__icon')
        .annotate(amount=Sum('amount'), count=Count('id'))
        .order_by('-amount')
    )

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
            'percentage': float(percentage),
        })

    return Response({
        'breakdown': result,
        'total': float(total),
        'period': {
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
        },
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def group_analytics(request, group_id):
    """Get analytics for a specific group."""
    user = request.user
    start_date, end_date = _parse_date_range(request)

    try:
        group = Group.objects.get(id=group_id)
        if not group.memberships.filter(user=user, is_active=True).exists():
            return Response(
                {'detail': 'You are not a member of this group'},
                status=status.HTTP_403_FORBIDDEN,
            )
    except Group.DoesNotExist:
        return Response(
            {'detail': 'Group not found'},
            status=status.HTTP_404_NOT_FOUND,
        )

    expenses_qs = Expense.objects.filter(
        group_id=group_id,
        expense_date__gte=start_date,
        expense_date__lte=end_date,
    )

    agg = expenses_qs.aggregate(total=Sum('amount'), count=Count('id'))

    member_stats = (
        ExpenseShare.objects.filter(
            expense__group_id=group_id,
            expense__expense_date__gte=start_date,
            expense__expense_date__lte=end_date,
        )
        .values('user__id', 'user__first_name', 'user__last_name')
        .annotate(
            total_paid=Sum('amount', filter=Q(user=F('paid_by'))),
            total_owed=Sum('amount', filter=~Q(user=F('paid_by'))),
        )
    )

    cat_breakdown = (
        expenses_qs
        .values('category__name')
        .annotate(amount=Sum('amount'), count=Count('id'))
        .order_by('-amount')
    )

    return Response({
        'group_id': group_id,
        'group_name': group.name,
        'total_expenses': float(agg['total'] or 0),
        'expense_count': agg['count'] or 0,
        'member_stats': list(member_stats),
        'category_breakdown': list(cat_breakdown),
        'period': {
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
        },
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_data(request, format):
    """Export analytics data as CSV or PDF."""
    start_date, end_date = _parse_date_range(request)
    group_id = request.query_params.get('groupId')

    expenses_qs = (
        _user_expenses_qs(request.user, start_date, end_date, group_id)
        .select_related('category', 'currency', 'paid_by', 'group')
        .prefetch_related('tags')
    )
    expenses = list(expenses_qs.order_by('-expense_date'))

    if format.lower() == 'csv':
        return generate_csv_export(expenses, start_date, end_date, request.user)
    elif format.lower() == 'pdf':
        return generate_pdf_export(expenses, start_date, end_date, request.user)
    else:
        return Response(
            {'detail': f'Unsupported format: {format}. Use csv or pdf'},
            status=status.HTTP_400_BAD_REQUEST,
        )
