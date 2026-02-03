from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

from apps.expenses.models import Expense
from .services import process_expense_deduction, process_expense_refund


@receiver(post_save, sender=Expense)
def on_expense_saved(sender, instance, created, **kwargs):
    if not instance.is_deleted and (instance.category_id or instance.user_category_id):
        process_expense_deduction(instance)


@receiver(post_delete, sender=Expense)
def on_expense_deleted(sender, instance, **kwargs):
    if instance.category_id or instance.user_category_id:
        process_expense_refund(instance)
