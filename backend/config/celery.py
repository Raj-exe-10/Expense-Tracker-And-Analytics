import os
from celery import Celery

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('expense_tracker')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
# - namespace='CELERY' means all celery-related configuration keys
#   should have a `CELERY_` prefix.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django apps.
app.autodiscover_tasks()


@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')


# Periodic tasks configuration
app.conf.beat_schedule = {
    'send-expense-reminders': {
        'task': 'apps.notifications.tasks.send_expense_reminders',
        'schedule': 86400.0,  # Run daily (86400 seconds)
    },
    'update-currency-rates': {
        'task': 'apps.core.tasks.update_currency_rates',
        'schedule': 3600.0,  # Run hourly
    },
    'cleanup-old-notifications': {
        'task': 'apps.notifications.tasks.cleanup_old_notifications',
        'schedule': 604800.0,  # Run weekly
    },
}

app.conf.timezone = 'UTC'
