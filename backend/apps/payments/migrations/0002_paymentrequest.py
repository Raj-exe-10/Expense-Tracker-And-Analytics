import uuid
from decimal import Decimal
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.core.validators


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
        ('groups', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('payments', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='PaymentRequest',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('amount', models.DecimalField(decimal_places=2, max_digits=15, validators=[django.core.validators.MinValueValidator(Decimal('0.01'))])),
                ('note', models.TextField(blank=True)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('approved', 'Approved'), ('disputed', 'Disputed'), ('cancelled', 'Cancelled')], default='pending', max_length=20)),
                ('currency', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='payment_requests', to='core.currency')),
                ('group', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='payment_requests', to='groups.group')),
                ('payee', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='payment_requests_received', to=settings.AUTH_USER_MODEL)),
                ('requester', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='payment_requests_sent', to=settings.AUTH_USER_MODEL)),
                ('settlement', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='payment_requests', to='payments.settlement')),
            ],
            options={
                'db_table': 'payment_requests',
                'ordering': ['-created_at'],
            },
        ),
    ]
