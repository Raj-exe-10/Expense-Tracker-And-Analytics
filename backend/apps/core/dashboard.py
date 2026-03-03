"""
Consolidated dashboard endpoint.

Returns user balances, recent expenses, group summaries and the unread
notification count in a single JSON payload — replacing five separate
round-trips on the frontend.
"""

from collections import defaultdict
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db.models import Q, Sum, Count
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.expenses.models import Expense, ExpenseShare
from apps.groups.models import Group, GroupMembership
from apps.notifications.models import Notification
from apps.payments.debt_simplifier import DebtSimplifier

User = get_user_model()

RECENT_EXPENSE_LIMIT = 10
GROUP_SUMMARY_LIMIT = 20


def _build_balances(user, shares_qs):
    """Compute raw + simplified balance data from an ExpenseShare queryset."""
    total_you_owe = Decimal("0")
    total_owed_to_you = Decimal("0")
    balances: dict = defaultdict(lambda: {"owed": Decimal("0"), "owes": Decimal("0")})

    for share in shares_qs:
        if share.user_id == user.id:
            if share.paid_by_id != user.id:
                balances[share.paid_by_id]["owed"] += share.amount
                total_you_owe += share.amount
        elif share.paid_by_id == user.id:
            balances[share.user_id]["owes"] += share.amount
            total_owed_to_you += share.amount

    net_balances = {}
    for other_id, amounts in balances.items():
        net = amounts["owes"] - amounts["owed"]
        if abs(net) > Decimal("0.01"):
            net_balances[str(other_id)] = net

    simplified = DebtSimplifier.minimize_transactions(net_balances)

    all_user_ids = set(balances.keys())
    for txn in simplified:
        all_user_ids.add(txn["from"])
        all_user_ids.add(txn["to"])
    users_map = (
        {str(u.id): u for u in User.objects.filter(id__in=all_user_ids)}
        if all_user_ids
        else {}
    )

    raw_balances = []
    for other_id, amounts in balances.items():
        other_user = users_map.get(str(other_id))
        if not other_user:
            continue
        name = other_user.get_full_name() or other_user.username
        if amounts["owed"] > Decimal("0.01"):
            raw_balances.append(
                {
                    "user_id": str(other_id),
                    "user_name": name,
                    "amount": float(amounts["owed"]),
                    "currency": "USD",
                    "you_owe": True,
                    "owes_you": False,
                }
            )
        if amounts["owes"] > Decimal("0.01"):
            raw_balances.append(
                {
                    "user_id": str(other_id),
                    "user_name": name,
                    "amount": float(amounts["owes"]),
                    "currency": "USD",
                    "you_owe": False,
                    "owes_you": True,
                }
            )

    transactions_with_names = []
    for txn in simplified:
        from_user = users_map.get(str(txn["from"]))
        to_user = users_map.get(str(txn["to"]))
        if not from_user or not to_user:
            continue
        transactions_with_names.append(
            {
                "from_user_id": txn["from"],
                "from_user_name": from_user.get_full_name() or from_user.username,
                "to_user_id": txn["to"],
                "to_user_name": to_user.get_full_name() or to_user.username,
                "amount": float(txn["amount"]),
                "currency": "USD",
            }
        )

    return {
        "balances": raw_balances,
        "simplified_transactions": transactions_with_names,
        "total_owed": float(total_you_owe),
        "total_owed_to_you": float(total_owed_to_you),
    }


def _build_recent_expenses(user):
    """Return the most recent expenses the user is involved in."""
    qs = (
        Expense.objects.filter(
            Q(paid_by=user)
            | Q(shares__user=user)
            | Q(group__memberships__user=user, group__memberships__is_active=True)
        )
        .select_related("paid_by", "category", "currency", "group")
        .distinct()
        .order_by("-expense_date", "-created_at")[:RECENT_EXPENSE_LIMIT]
    )

    return [
        {
            "id": str(e.id),
            "title": e.title,
            "amount": float(e.amount),
            "currency": e.currency.code if e.currency else "USD",
            "expense_date": e.expense_date.isoformat() if e.expense_date else None,
            "category": e.category.name if e.category else None,
            "group_id": str(e.group_id) if e.group_id else None,
            "group_name": e.group.name if e.group else None,
            "paid_by": {
                "id": e.paid_by.id,
                "username": e.paid_by.username,
                "full_name": e.paid_by.get_full_name(),
            },
            "is_settled": e.is_settled,
        }
        for e in qs
    ]


def _build_group_summaries(user):
    """Return lightweight summaries for every active group the user belongs to."""
    membership_ids = GroupMembership.objects.filter(
        user=user, is_active=True
    ).values_list("group_id", flat=True)

    groups = (
        Group.objects.filter(id__in=membership_ids, is_active=True)
        .annotate(
            expense_total=Sum("expenses__amount"),
            expense_count=Count("expenses__id"),
        )
        .order_by("-updated_at")[:GROUP_SUMMARY_LIMIT]
    )

    return [
        {
            "id": str(g.id),
            "name": g.name,
            "group_type": g.group_type,
            "member_count": g.member_count,
            "total_expenses": float(g.expense_total or 0),
            "expense_count": g.expense_count or 0,
        }
        for g in groups
    ]


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_summary(request):
    """Aggregated dashboard payload — one request replaces five.

    Returns:
        - balances: user balance / debt data
        - recent_expenses: last N expenses
        - groups: lightweight group summaries
        - unread_notifications: count of unread notifications
    """
    user = request.user

    shares_qs = (
        ExpenseShare.objects.filter(
            Q(user=user) | Q(paid_by=user),
            is_settled=False,
        )
        .select_related("user", "paid_by", "expense")
    )

    return Response(
        {
            "balances": _build_balances(user, shares_qs),
            "recent_expenses": _build_recent_expenses(user),
            "groups": _build_group_summaries(user),
            "unread_notifications": Notification.objects.filter(
                user=user, is_read=False
            ).count(),
        }
    )
