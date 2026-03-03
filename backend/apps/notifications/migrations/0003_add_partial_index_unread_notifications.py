import django.db.models
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("notifications", "0002_budget_notification_types"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="notification",
            index=models.Index(
                condition=models.Q(is_read=False),
                fields=["user", "-created_at"],
                name="idx_notifications_unread",
            ),
        ),
    ]
