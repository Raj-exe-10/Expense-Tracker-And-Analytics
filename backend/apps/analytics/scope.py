"""Expense querysets by post-game analytics scope."""
from django.db.models import Q
from apps.expenses.models import Expense
from apps.groups.models import GroupMembership


def scoped_expenses(user, start_date, end_date, scope: str):
    """
    scope: personal | group | combined
    """
    base = Expense.objects.filter(
        is_deleted=False,
        expense_date__gte=start_date,
        expense_date__lte=end_date,
    ).select_related('category', 'currency', 'group', 'paid_by')

    if scope == 'personal':
        return base.filter(paid_by=user, group__isnull=True)

    member_group_ids = GroupMembership.objects.filter(
        user=user, is_active=True
    ).values_list('group_id', flat=True)

    if scope == 'group':
        return base.filter(group_id__in=member_group_ids)

    # combined
    return base.filter(
        Q(paid_by=user, group__isnull=True) | Q(group_id__in=member_group_ids)
    ).distinct()
