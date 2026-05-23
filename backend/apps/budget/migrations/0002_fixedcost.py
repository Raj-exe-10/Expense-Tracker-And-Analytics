import uuid
from decimal import Decimal
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.core.validators


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('budget', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='FixedCost',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('name', models.CharField(max_length=120)),
                ('amount', models.DecimalField(decimal_places=2, max_digits=15, validators=[django.core.validators.MinValueValidator(Decimal('0.01'))])),
                ('due_day_of_month', models.PositiveSmallIntegerField(default=1)),
                ('icon', models.CharField(blank=True, max_length=50)),
                ('category_label', models.CharField(blank=True, max_length=80)),
                ('is_active', models.BooleanField(default=True)),
                ('currency', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='fixed_costs', to='core.currency')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='fixed_costs', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'budget_fixed_costs',
                'ordering': ['due_day_of_month', 'name'],
            },
        ),
    ]
