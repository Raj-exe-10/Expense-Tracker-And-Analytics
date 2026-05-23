import uuid
from decimal import Decimal
from django.conf import settings
from django.db import migrations, models
import django.core.validators
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('budget', '0002_fixedcost'),
    ]

    operations = [
        migrations.CreateModel(
            name='SavingsGoal',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=120)),
                ('target_amount', models.DecimalField(
                    decimal_places=2,
                    max_digits=15,
                    validators=[django.core.validators.MinValueValidator(Decimal('0.01'))],
                )),
                ('current_amount', models.DecimalField(
                    decimal_places=2,
                    default=Decimal('0'),
                    max_digits=15,
                    validators=[django.core.validators.MinValueValidator(Decimal('0'))],
                )),
                ('target_date', models.DateField(blank=True, null=True)),
                ('is_active', models.BooleanField(default=True)),
                ('currency', models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name='savings_goals',
                    to='core.currency',
                )),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='savings_goals',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'db_table': 'budget_savings_goals',
                'ordering': ['-created_at'],
            },
        ),
    ]
