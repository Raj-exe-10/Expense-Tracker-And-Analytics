"""Build unified post-game analytics payload."""
import logging
from calendar import monthrange
from datetime import date
from decimal import Decimal

from django.db.models import Sum

from apps.budget.models import MonthlyBudget, SavingsGoal, WalletAllocation
from apps.budget.services import get_spent_for_wallet_allocation
from apps.core.currency_utils import convert_amount, expense_amount_in_currency
from apps.budget.services import ensure_monthly_budget
from apps.core.models import Currency

from .scope import scoped_expenses
from .insight_rules import generate_rule_insights, merge_insights, _prev_month
from .insight_notifications import notify_critical_insights
from .ml.debounce import get_last_trained_at
from .ml import features as feat

logger = logging.getLogger(__name__)


def _compute_total_in(user, year, month):
    income = float(user.monthly_income or 0)
    income_missing = user.monthly_income is None
    rollover = Decimal('0')
    try:
        mb = MonthlyBudget.objects.get(user=user, year=year, month=month)
        rollover = WalletAllocation.objects.filter(monthly_budget=mb).aggregate(
            t=Sum('rollover_from_previous')
        )['t'] or Decimal('0')
    except MonthlyBudget.DoesNotExist:
        pass
    total = income + float(rollover)
    return total, income_missing, float(rollover)


def _budget_vs_actual(user, year, month, target_currency):
    currency = Currency.objects.filter(code=target_currency).first()
    if not currency:
        return []
    mb = MonthlyBudget.objects.filter(user=user, year=year, month=month).first()
    if not mb:
        mb = ensure_monthly_budget(user, year, month, currency)
    rows = []
    for alloc in WalletAllocation.objects.filter(monthly_budget=mb).select_related('wallet'):
        spent_dec = get_spent_for_wallet_allocation(alloc, alloc.wallet)
        spent = float(spent_dec)
        if mb.currency.code != target_currency:
            conv = convert_amount(spent_dec, mb.currency.code, target_currency)
            spent = float(conv) if conv is not None else spent
        budget = float(alloc.amount + alloc.rollover_from_previous)
        pct = (spent / budget * 100) if budget > 0 else 0
        rows.append({
            'wallet_id': str(alloc.wallet_id),
            'name': alloc.wallet.name,
            'budget': round(budget, 2),
            'spent': round(spent, 2),
            'percent_used': round(pct, 1),
            'over_budget': spent > budget and budget > 0,
        })
    return rows


def _cash_flow(expenses, total_in, target_currency):
    by_cat = {}
    for e in expenses:
        amt = expense_amount_in_currency(e, target_currency)
        if amt is None:
            continue
        cat = e.category.name if e.category_id else 'Uncategorized'
        by_cat[cat] = by_cat.get(cat, 0) + amt

    sorted_cats = sorted(by_cat.items(), key=lambda x: -x[1])[:8]
    nodes = [{'id': 'income', 'label': 'Total In', 'value': total_in}]
    links = []
    category_cards = []
    for cat, val in sorted_cats:
        nodes.append({'id': cat, 'label': cat, 'value': val})
        links.append({'source': 'income', 'target': cat, 'value': val})
        category_cards.append({'name': cat, 'amount': round(val, 2), 'mom_percent': None})

    return {
        'income': total_in,
        'nodes': nodes,
        'links': links,
        'category_cards': category_cards,
    }


def _intensity_heatmap(expenses, year, month, target_currency):
    _, last_day = monthrange(year, month)
    days = list(range(1, last_day + 1, max(1, last_day // 14)))
    if days[-1] != last_day:
        days.append(last_day)

    by_cat_day = {}
    for e in expenses:
        if not e.expense_date or e.expense_date.year != year or e.expense_date.month != month:
            continue
        amt = expense_amount_in_currency(e, target_currency)
        if amt is None:
            continue
        cat = e.category.name if e.category_id else 'Uncategorized'
        by_cat_day.setdefault(cat, {})[e.expense_date.day] = by_cat_day.get(cat, {}).get(e.expense_date.day, 0) + amt

    top_cats = sorted(by_cat_day.keys(), key=lambda c: -sum(by_cat_day[c].values()))[:6]
    max_val = 1
    rows = []
    for cat in top_cats:
        cells = []
        for d in days:
            v = by_cat_day[cat].get(d, 0)
            max_val = max(max_val, v)
            cells.append({'day': d, 'amount': round(v, 2), 'intensity': 0})
        rows.append({'category': cat, 'cells': cells})

    for row in rows:
        for cell in row['cells']:
            cell['intensity'] = min(4, int((cell['amount'] / max_val) * 4)) if max_val else 0

    return {'days': days, 'rows': rows, 'max': max_val}


def build_post_game_payload(user, year=None, month=None, scope='personal'):
    today = date.today()
    year = int(year or today.year)
    month = int(month or today.month)
    target_currency = user.preferred_currency or 'USD'

    start, end = feat.month_range(year, month)
    py, pm = _prev_month(year, month)
    pstart, pend = feat.month_range(py, pm)

    expenses = list(scoped_expenses(user, start, end, scope))
    expenses_prev = list(scoped_expenses(user, pstart, pend, scope))

    total_in, income_missing, rollover = _compute_total_in(user, year, month)
    budget_rows = _budget_vs_actual(user, year, month, target_currency)
    cash_flow = _cash_flow(expenses, total_in, target_currency)
    intensity = _intensity_heatmap(expenses, year, month, target_currency)

    goals = list(SavingsGoal.objects.filter(user=user, is_active=True).select_related('currency'))
    savings_goals = [
        {
            'id': str(g.id),
            'name': g.name,
            'target_amount': float(g.target_amount),
            'current_amount': float(g.current_amount),
            'progress_percent': g.progress_percent,
            'target_date': g.target_date.isoformat() if g.target_date else None,
        }
        for g in goals
    ]

    rule_insights = generate_rule_insights(
        user, expenses, expenses_prev, target_currency, budget_rows, goals, year, month
    )

    from .ml.predict import run_ml_pipeline
    try:
        ml_result = run_ml_pipeline(
            user, scoped_expenses(user, start, end, scope), target_currency, budget_rows, year, month
        )
    except Exception:
        logger.exception('ML pipeline failed for user %s', user.id)
        ml_result = {
            'forecasts': [], 'risks': [], 'anomalies': [], 'ml_insights': [],
            'ml_is_estimate': True, 'ml_available': False,
        }
    insights = merge_insights(rule_insights, ml_result.get('ml_insights', []))
    notify_critical_insights(user, insights)

    last_trained = get_last_trained_at(user.id)

    return {
        'meta': {
            'year': year,
            'month': month,
            'scope': scope,
            'currency': target_currency,
            'income_missing': income_missing,
            'monthly_income': float(user.monthly_income or 0),
            'rollover_total': rollover,
            'ml_is_estimate': ml_result.get('ml_is_estimate', True),
            'ml_available': ml_result.get('ml_available', False),
            'last_trained_at': last_trained.isoformat() if last_trained else None,
        },
        'cash_flow': cash_flow,
        'budget_vs_actual': budget_rows,
        'intensity': intensity,
        'insights': insights,
        'ml': {
            'forecasts': ml_result.get('forecasts', []),
            'risks': ml_result.get('risks', []),
            'anomalies': ml_result.get('anomalies', []),
        },
        'savings_goals': savings_goals,
    }
