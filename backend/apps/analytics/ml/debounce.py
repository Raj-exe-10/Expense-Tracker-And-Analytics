from django.core.cache import cache
from django.utils import timezone

DEBOUNCE_SECONDS = 300
DIRTY_KEY = 'ml_dirty:{user_id}'
LAST_TRAIN_KEY = 'ml_last_train:{user_id}'


def mark_ml_dirty(user_id):
    cache.set(DIRTY_KEY.format(user_id=user_id), True, timeout=86400)


def should_retrain(user_id) -> bool:
    dirty = cache.get(DIRTY_KEY.format(user_id=user_id))
    if not dirty:
        return False
    last = cache.get(LAST_TRAIN_KEY.format(user_id=user_id))
    if not last:
        return True
    elapsed = (timezone.now() - last).total_seconds()
    return elapsed >= DEBOUNCE_SECONDS


def mark_trained(user_id):
    cache.delete(DIRTY_KEY.format(user_id=user_id))
    cache.set(LAST_TRAIN_KEY.format(user_id=user_id), timezone.now(), timeout=86400 * 7)


def get_last_trained_at(user_id):
    return cache.get(LAST_TRAIN_KEY.format(user_id=user_id))
