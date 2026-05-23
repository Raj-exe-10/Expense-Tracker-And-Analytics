from collections import defaultdict
from datetime import date, timedelta
import calendar


def build_category_daily_totals(expenses, target_currency, convert_fn):
    """Returns dict[category_name][date_str] = amount float."""
    grid = defaultdict(lambda: defaultdict(float))
    for exp in expenses:
        amt = convert_fn(exp, target_currency)
        if amt is None:
            continue
        cat = exp.category.name if exp.category_id else 'Uncategorized'
        d = exp.expense_date.isoformat() if exp.expense_date else None
        if d:
            grid[cat][d] += amt
    return grid


def month_range(year: int, month: int):
    start = date(year, month, 1)
    last = calendar.monthrange(year, month)[1]
    end = date(year, month, last)
    return start, end


def days_in_month_elapsed(year: int, month: int, today: date | None = None) -> tuple[int, int]:
    today = today or date.today()
    total = calendar.monthrange(year, month)[1]
    if today.year != year or today.month != month:
        return total, total
    return today.day, total
