from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0003_ledgercore_security_profile'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='monthly_income',
            field=models.DecimalField(
                blank=True,
                decimal_places=2,
                help_text='Monthly income for cash-flow and post-game analytics',
                max_digits=15,
                null=True,
            ),
        ),
    ]
