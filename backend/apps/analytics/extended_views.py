from datetime import timedelta
from django.db.models import Sum, Count
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.expenses.models import Expense
from .views import _parse_date_range, _user_expenses_qs


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def spending_flow(request):
    user = request.user
    start_date, end_date = _parse_date_range(request)
    expenses = _user_expenses_qs(user, start_date, end_date)
    by_cat = (
        expenses.values('category__name')
        .annotate(total=Sum('amount'))
        .order_by('-total')[:8]
    )
    income = float(request.query_params.get('income', 0) or 0)
    if not income:
        income = float(expenses.aggregate(t=Sum('amount'))['t'] or 0) * 1.2
    nodes = [{'id': 'income', 'label': 'Income', 'value': income}]
    links = []
    for row in by_cat:
        label = row['category__name'] or 'Other'
        val = float(row['total'] or 0)
        nodes.append({'id': label, 'label': label, 'value': val})
        links.append({'source': 'income', 'target': label, 'value': val})
    return Response({'income': income, 'nodes': nodes, 'links': links})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def spending_intensity(request):
    user = request.user
    start_date, end_date = _parse_date_range(request)
    expenses = _user_expenses_qs(user, start_date, end_date)
    daily = (
        expenses.annotate(day=TruncDate('expense_date'))
        .values('day')
        .annotate(total=Sum('amount'), count=Count('id'))
        .order_by('day')
    )
    grid = []
    max_val = 1
    for row in daily:
        v = float(row['total'] or 0)
        max_val = max(max_val, v)
        grid.append({
            'date': row['day'].isoformat() if row['day'] else None,
            'amount': v,
            'count': row['count'],
        })
    for cell in grid:
        cell['intensity'] = min(4, int((cell['amount'] / max_val) * 4)) if max_val else 0
    return Response({'cells': grid, 'max': max_val})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def smart_insights(request):
    user = request.user
    end = timezone.now().date()
    start = end - timedelta(days=30)
    prev_start = start - timedelta(days=30)
    current = _user_expenses_qs(user, start, end)
    previous = _user_expenses_qs(user, prev_start, start)
    cur_total = float(current.aggregate(t=Sum('amount'))['t'] or 0)
    prev_total = float(previous.aggregate(t=Sum('amount'))['t'] or 1)
    pct = ((cur_total - prev_total) / prev_total) * 100 if prev_total else 0
    insights = []
    if pct > 15:
        insights.append({
            'type': 'warning',
            'title': 'Spending increased',
            'detail': f'You spent {pct:.0f}% more than the previous 30 days.',
        })
    else:
        insights.append({
            'type': 'success',
            'title': 'Spending on track',
            'detail': 'Your spending is within normal range for this period.',
        })
    try:
        from apps.budget.models import FixedCost
        from datetime import date
        upcoming = FixedCost.objects.filter(
            user=user, is_active=True, due_day_of_month__lte=date.today().day + 3
        )
        for fc in upcoming[:1]:
            insights.append({
                'type': 'info',
                'title': 'Upcoming bill',
                'detail': f'{fc.name} of {fc.amount} is due soon.',
            })
    except Exception:
        pass
    return Response({'insights': insights})
