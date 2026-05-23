from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('expenses', '0004_add_partial_index_unsettled_shares'),
    ]

    operations = [
        migrations.AddField(
            model_name='expense',
            name='version',
            field=models.PositiveIntegerField(default=1),
        ),
    ]
