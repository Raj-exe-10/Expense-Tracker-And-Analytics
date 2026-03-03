import django.db.models
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("expenses", "0003_add_user_category"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="expenseshare",
            index=models.Index(
                condition=models.Q(is_settled=False),
                fields=["user_id", "paid_by_id"],
                name="idx_shares_unsettled",
            ),
        ),
    ]
