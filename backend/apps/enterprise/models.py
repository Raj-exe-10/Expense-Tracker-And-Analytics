from django.db import models
from django.contrib.auth import get_user_model
from apps.core.models import TimeStampedModel, UUIDModel
from apps.groups.models import Group
from decimal import Decimal

User = get_user_model()


class Entity(UUIDModel, TimeStampedModel):
    ENTITY_STATUS = [
        ('active', 'Active'),
        ('flagged', 'Flagged'),
        ('inactive', 'Inactive'),
    ]

    name = models.CharField(max_length=200, db_index=True)
    tax_id = models.CharField(max_length=50, blank=True, db_index=True)
    balance = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0'))
    status = models.CharField(max_length=20, choices=ENTITY_STATUS, default='active')
    supervised_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='supervised_entities',
    )
    squads = models.ManyToManyField(Group, blank=True, related_name='entities')

    class Meta:
        db_table = 'enterprise_entities'
        ordering = ['name']

    def __str__(self):
        return self.name

    @property
    def active_squads_count(self):
        return self.squads.filter(is_active=True).count()


class AuditEvent(UUIDModel, TimeStampedModel):
    AUDIT_STATUS = [
        ('verified', 'Verified'),
        ('pending', 'Pending'),
        ('flagged', 'Flagged'),
    ]

    action_type = models.CharField(max_length=80)
    description = models.TextField()
    actor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_events',
    )
    actor_name = models.CharField(max_length=120, blank=True)
    is_system = models.BooleanField(default=False)
    entity = models.ForeignKey(
        Entity,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='audit_events',
    )
    status = models.CharField(max_length=20, choices=AUDIT_STATUS, default='pending')
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = 'enterprise_audit_events'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.action_type} — {self.status}"


class ExportJob(UUIDModel, TimeStampedModel):
    FORMATS = [('csv', 'CSV'), ('pdf', 'PDF'), ('json', 'JSON')]
    JOB_STATUS = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='export_jobs',
    )
    format = models.CharField(max_length=10, choices=FORMATS, default='csv')
    date_from = models.DateField()
    date_to = models.DateField()
    columns = models.JSONField(default=list)
    status = models.CharField(max_length=20, choices=JOB_STATUS, default='pending')
    file_path = models.CharField(max_length=500, blank=True)
    error_message = models.TextField(blank=True)

    class Meta:
        db_table = 'enterprise_export_jobs'
        ordering = ['-created_at']

    def __str__(self):
        return f"Export {self.id} ({self.status})"
