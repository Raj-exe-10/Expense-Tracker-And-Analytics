from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

from .models import Expense


@receiver(post_save, sender=Expense)
@receiver(post_delete, sender=Expense)
def mark_user_ml_dirty(sender, instance, **kwargs):
    user_id = None
    if instance.paid_by_id:
        user_id = instance.paid_by_id
    if user_id:
        from apps.analytics.ml.debounce import mark_ml_dirty
        mark_ml_dirty(str(user_id))
