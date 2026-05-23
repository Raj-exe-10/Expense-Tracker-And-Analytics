import uuid
from decimal import Decimal
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('groups', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Entity',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('name', models.CharField(db_index=True, max_length=200)),
                ('tax_id', models.CharField(blank=True, db_index=True, max_length=50)),
                ('balance', models.DecimalField(decimal_places=2, default=Decimal('0'), max_digits=15)),
                ('status', models.CharField(choices=[('active', 'Active'), ('flagged', 'Flagged'), ('inactive', 'Inactive')], default='active', max_length=20)),
                ('squads', models.ManyToManyField(blank=True, related_name='entities', to='groups.group')),
                ('supervised_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='supervised_entities', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'enterprise_entities',
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='AuditEvent',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('action_type', models.CharField(max_length=80)),
                ('description', models.TextField()),
                ('actor_name', models.CharField(blank=True, max_length=120)),
                ('is_system', models.BooleanField(default=False)),
                ('status', models.CharField(choices=[('verified', 'Verified'), ('pending', 'Pending'), ('flagged', 'Flagged')], default='pending', max_length=20)),
                ('metadata', models.JSONField(blank=True, default=dict)),
                ('actor', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='audit_events', to=settings.AUTH_USER_MODEL)),
                ('entity', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='audit_events', to='enterprise.entity')),
            ],
            options={
                'db_table': 'enterprise_audit_events',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='ExportJob',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('format', models.CharField(choices=[('csv', 'CSV'), ('pdf', 'PDF'), ('json', 'JSON')], default='csv', max_length=10)),
                ('date_from', models.DateField()),
                ('date_to', models.DateField()),
                ('columns', models.JSONField(default=list)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('processing', 'Processing'), ('completed', 'Completed'), ('failed', 'Failed')], default='pending', max_length=20)),
                ('file_path', models.CharField(blank=True, max_length=500)),
                ('error_message', models.TextField(blank=True)),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='export_jobs', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'enterprise_export_jobs',
                'ordering': ['-created_at'],
            },
        ),
    ]
