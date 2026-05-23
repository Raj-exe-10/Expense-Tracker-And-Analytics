"""Global category spending priors for cold-start ML."""
from django.db.models import Avg, Count
from apps.expenses.models import Expense


def get_global_category_priors():
    rows = (
        Expense.objects.filter(is_deleted=False, category__isnull=False)
        .values('category__name')
        .annotate(avg_amount=Avg('amount'), cnt=Count('id'))
    )
    priors = {}
    for row in rows:
        name = row['category__name'] or 'Other'
        avg = float(row['avg_amount'] or 0)
        priors[name] = {
            'avg': avg,
            'std': max(avg * 0.35, 1.0),
            'count': row['cnt'] or 0,
        }
    if not priors:
        priors['Other'] = {'avg': 50.0, 'std': 25.0, 'count': 0}
    return priors
