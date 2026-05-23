"""Rule-based post-game insights."""
from datetime import date, timedelta
from apps.budget.models import FixedCost
from apps.core.currency_utils import expense_amount_in_currency


def _prev_month(year: int, month: int):
    if month == 1:
        return year - 1, 12
    return year, month - 1


def generate_rule_insights(
    user,
    expenses_current,
    expenses_previous,
    target_currency,
    budget_rows,
    savings_goals,
    year,
    month,
):
    insights = []

    # MoM total
    cur_total = sum(expense_amount_in_currency(e, target_currency) or 0 for e in expenses_current)
    prev_total = sum(expense_amount_in_currency(e, target_currency) or 0 for e in expenses_previous)
    if prev_total > 0:
        pct = ((cur_total - prev_total) / prev_total) * 100
        if pct > 15:
            insights.append({
                'id': 'rule_spending_up',
                'type': 'warning',
                'severity': 'medium',
                'title': 'Spending increased',
                'detail': f'You spent {pct:.0f}% more than the previous month.',
                'source': 'rule',
                'insight_key': f'spending_up_{year}_{month}',
            })
        elif pct < -10:
            insights.append({
                'id': 'rule_spending_down',
                'type': 'success',
                'severity': 'low',
                'title': 'Spending decreased',
                'detail': f'You spent {abs(pct):.0f}% less than the previous month.',
                'source': 'rule',
                'insight_key': f'spending_down_{year}_{month}',
            })

    # Per-category MoM
    def cat_totals(expenses):
        totals = {}
        for e in expenses:
            cat = e.category.name if e.category_id else 'Uncategorized'
            amt = expense_amount_in_currency(e, target_currency) or 0
            totals[cat] = totals.get(cat, 0) + amt
        return totals

    cur_cats = cat_totals(expenses_current)
    prev_cats = cat_totals(expenses_previous)
    for cat, cur_amt in sorted(cur_cats.items(), key=lambda x: -x[1])[:5]:
        prev_amt = prev_cats.get(cat, 0)
        if prev_amt > 0 and cur_amt > prev_amt * 1.15:
            diff = cur_amt - prev_amt
            insights.append({
                'id': f'rule_cat_high_{cat}',
                'type': 'warning',
                'severity': 'medium',
                'title': f'{cat} spend is high',
                'detail': f'You spent ${diff:,.0f} more on {cat.lower()} this month vs last month.',
                'source': 'rule',
                'insight_key': f'cat_high_{cat}_{year}_{month}',
            })

    # Budget vs actual
    for row in budget_rows:
        if row.get('over_budget'):
            insights.append({
                'id': f'rule_over_{row["wallet_id"]}',
                'type': 'warning',
                'severity': 'critical',
                'title': f'{row["name"]} budget exceeded',
                'detail': f'Spent ${row["spent"]:,.0f} of ${row["budget"]:,.0f} allocated ({row["percent_used"]:.0f}%).',
                'source': 'rule',
                'insight_key': f'over_budget_{row["wallet_id"]}_{year}_{month}',
                'action': '/app/budget',
            })
        elif row.get('percent_used', 0) > 85:
            insights.append({
                'id': f'rule_near_{row["wallet_id"]}',
                'type': 'info',
                'severity': 'medium',
                'title': f'{row["name"]} nearing limit',
                'detail': f'{row["percent_used"]:.0f}% of wallet budget used with time left in the month.',
                'source': 'rule',
                'insight_key': f'near_budget_{row["wallet_id"]}_{year}_{month}',
            })

    # Fixed costs
    today = date.today()
    for fc in FixedCost.objects.filter(user=user, is_active=True)[:5]:
        days_until = max(0, fc.due_day_of_month - today.day)
        if days_until <= 7:
            insights.append({
                'id': f'rule_fc_{fc.id}',
                'type': 'info',
                'severity': 'low',
                'title': 'Upcoming bill',
                'detail': f'{fc.name} (${float(fc.amount):,.0f}) expected in {days_until} days.',
                'source': 'rule',
                'insight_key': f'fixed_cost_{fc.id}_{today.isoformat()}',
            })

    # Savings goals
    for goal in savings_goals:
        pct = goal.progress_percent
        if pct >= 80:
            insights.append({
                'id': f'rule_goal_{goal.id}',
                'type': 'success',
                'severity': 'low',
                'title': 'Savings on track',
                'detail': f'"{goal.name}" is at {pct:.0f}% of your ${float(goal.target_amount):,.0f} goal.',
                'source': 'rule',
                'insight_key': f'savings_goal_{goal.id}',
            })
        elif pct < 30 and goal.target_date and goal.target_date < today + timedelta(days=60):
            insights.append({
                'id': f'rule_goal_behind_{goal.id}',
                'type': 'warning',
                'severity': 'medium',
                'title': 'Savings goal behind',
                'detail': f'"{goal.name}" is only {pct:.0f}% complete with target date approaching.',
                'source': 'rule',
                'insight_key': f'savings_behind_{goal.id}',
            })

    return insights


def merge_insights(rule_insights, ml_insights):
    """Dedupe by insight_key, rank by severity."""
    severity_order = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}
    seen = {}
    merged = []
    for ins in rule_insights + ml_insights:
        key = ins.get('insight_key') or ins.get('id')
        if key in seen:
            continue
        seen[key] = True
        merged.append(ins)
    merged.sort(key=lambda x: severity_order.get(x.get('severity', 'low'), 9))
    return merged
