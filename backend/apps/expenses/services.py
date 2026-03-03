"""
Expense service layer: share creation, group totals, notifications.
"""
import logging
from decimal import Decimal, ROUND_DOWN

from django.contrib.auth import get_user_model

from .models import Expense, ExpenseShare
from apps.groups.models import Group

User = get_user_model()
logger = logging.getLogger(__name__)


class ExpenseService:
    """Business logic for expense create/update/delete."""

    @staticmethod
    def create_equal_shares(expense: Expense) -> None:
        """Create equal shares for all active group members.

        Uses ROUND_DOWN per share and assigns the residual cents to the first
        member so that the share amounts always sum exactly to expense.amount.
        """
        if not expense.group:
            return
        memberships = list(expense.group.memberships.filter(is_active=True))
        count = len(memberships)
        if count == 0:
            return

        base_amount = (expense.amount / count).quantize(Decimal('0.01'), rounding=ROUND_DOWN)
        remainder = expense.amount - (base_amount * count)

        for idx, membership in enumerate(memberships):
            share_amount = base_amount + (remainder if idx == 0 else Decimal('0'))
            ExpenseShare.objects.get_or_create(
                expense=expense,
                user=membership.user,
                defaults={
                    'amount': share_amount,
                    'currency': expense.currency,
                    'paid_by': expense.paid_by,
                },
            )

    @staticmethod
    def update_group_total_expenses(group: Group) -> None:
        """Recalculate and save group's total_expenses."""
        try:
            group.update_total_expenses()
        except Exception as e:
            logger.warning("Failed to update group total expenses: %s", e)

    @staticmethod
    def notify_expense_added(expense: Expense, user: User) -> list:
        """Send notifications for a new expense. Returns list of created notifications."""
        try:
            from apps.notifications.services import NotificationService
            notifications = NotificationService.notify_expense_added(expense, user)
            logger.info("Created %s notifications for expense %s", len(notifications), expense.id)
            return notifications
        except Exception as e:
            logger.error("Failed to create expense notifications: %s", e, exc_info=True)
            return []

    @staticmethod
    def notify_expense_updated(expense: Expense, user: User) -> list:
        """Send notifications for an updated expense. Returns list of created notifications."""
        try:
            from apps.notifications.services import NotificationService
            notifications = NotificationService.notify_expense_updated(expense, user)
            logger.info("Created %s update notifications for expense %s", len(notifications), expense.id)
            return notifications
        except Exception as e:
            logger.error("Failed to create expense update notifications: %s", e, exc_info=True)
            return []

    @classmethod
    def after_create(cls, expense: Expense, validated_data: dict, user: User) -> None:
        """
        Run after an expense is created: equal shares if group expense without shares_data,
        update group total, send notifications.
        """
        if expense.group and not validated_data.get('shares_data'):
            cls.create_equal_shares(expense)
        if expense.group:
            cls.update_group_total_expenses(expense.group)
        cls.notify_expense_added(expense, user)

    @classmethod
    def after_update(cls, expense: Expense, user: User) -> None:
        """Run after an expense is updated: update group total, send notifications."""
        if expense.group:
            cls.update_group_total_expenses(expense.group)
        cls.notify_expense_updated(expense, user)

    @classmethod
    def after_destroy(cls, group: Group | None) -> None:
        """Run after an expense is deleted: update group total if it was a group expense."""
        if group:
            cls.update_group_total_expenses(group)
