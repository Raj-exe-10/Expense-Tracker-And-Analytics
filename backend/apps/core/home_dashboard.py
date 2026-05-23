"""Aggregated home screen payload for LedgerCore."""
from datetime import date
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.db.models import Q, Sum
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.expenses.models import Expense, ExpenseShare
from apps.budget.models import FixedCost
from django.utils import timezone
from apps.core.models import Currency
from apps.budget.services import ensure_monthly_budget
from apps.notifications.models import Notification
from .dashboard import _build_balances, _build_recent_expenses

User = get_user_model()


def _month_spent(user):
    today = date.today()
    total = Expense.objects.filter(
        paid_by=user,
        is_deleted=False,
        expense_date__year=today.year,
        expense_date__month=today.month,
    ).aggregate(s=Sum('amount'))['s'] or Decimal('0')
    return float(total)


def _upcoming_fixed_costs(user, limit=5):
    today = date.today()
    costs = FixedCost.objects.filter(user=user, is_active=True).select_related('currency')[:limit]
    result = []
    for fc in costs:
        result.append({
            'id': str(fc.id),
            'name': fc.name,
            'amount': float(fc.amount),
            'currency': fc.currency.code if fc.currency else 'USD',
            'due_day_of_month': fc.due_day_of_month,
            'days_until': max(0, fc.due_day_of_month - today.day),
            'icon': fc.icon,
        })
    return result


def _get_monthly_budget(user):
    now = timezone.now()
    currency = Currency.objects.filter(code=user.preferred_currency).first()
    if not currency:
        currency = Currency.objects.filter(code='USD').first()
    if not currency:
        return None
    return ensure_monthly_budget(user, now.year, now.month, currency)


def _safe_to_spend(user):
    try:
        mb = _get_monthly_budget(user)
        if not mb:
            return 0.0
        remaining = float(mb.unassigned_amount or 0)
        upcoming = sum(
            float(fc.amount)
            for fc in FixedCost.objects.filter(user=user, is_active=True)
            if fc.due_day_of_month <= date.today().day + 14
        )
        return max(0.0, remaining - upcoming)
    except Exception:
        return 0.0


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def home_dashboard(request):
    user = request.user
    balances = {'balances': [], 'total_owed': 0, 'total_owed_to_you': 0}
    try:
        shares_qs = ExpenseShare.objects.filter(
            Q(user=user) | Q(paid_by=user),
            is_settled=False,
        ).select_related('user', 'paid_by', 'expense')
        balances = _build_balances(user, shares_qs)
    except Exception:
        pass

    net = balances.get('total_owed_to_you', 0) - balances.get('total_owed', 0)

    people = []
    for b in balances.get('balances', []):
        if b.get('owes_you'):
            people.append({
                'user_id': b['user_id'],
                'name': b['user_name'],
                'amount': b['amount'],
                'direction': 'owes_you',
                'settled': False,
            })
        elif b.get('you_owe'):
            people.append({
                'user_id': b['user_id'],
                'name': b['user_name'],
                'amount': b['amount'],
                'direction': 'you_owe',
                'settled': False,
            })

    today = date.today()
    month_label = today.strftime('%B %Y')

    try:
        mb = _get_monthly_budget(user)
        budget_summary = {
            'total': float(mb.total_amount) if mb else 0,
            'spent': _month_spent(user),
            'remaining': float(mb.unassigned_amount or 0) if mb else 0,
            'currency': mb.currency.code if mb and mb.currency else user.preferred_currency,
        }
    except Exception:
        budget_summary = {'total': 0, 'spent': _month_spent(user), 'remaining': 0, 'currency': user.preferred_currency}

    try:
        recent = _build_recent_expenses(user)[:3]
    except Exception:
        recent = []

    hide_balances = False
    try:
        hide_balances = getattr(user.profile, 'hide_balances', False) if hasattr(user, 'profile') else False
    except Exception:
        pass

    return Response({
        'greeting_name': user.first_name or user.username,
        'month_label': month_label,
        'month_spent': _month_spent(user),
        'net_balance': round(net, 2),
        'people_balances': people,
        'people_owe_you_count': len([p for p in people if p['direction'] == 'owes_you']),
        'safe_to_spend': _safe_to_spend(user),
        'budget_summary': budget_summary,
        'upcoming_fixed_costs': _upcoming_fixed_costs(user),
        'recent_activity': recent,
        'unread_notifications': Notification.objects.filter(user=user, is_read=False).count(),
        'hide_balances': hide_balances,
    })
