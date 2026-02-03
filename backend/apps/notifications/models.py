from django.db import models
from django.contrib.auth import get_user_model
from apps.core.models import TimeStampedModel, UUIDModel
import uuid

User = get_user_model()


class Notification(UUIDModel, TimeStampedModel):
    """
    Model for user notifications
    """
    NOTIFICATION_TYPES = [
        ('expense_added', 'Expense Added'),
        ('expense_updated', 'Expense Updated'),
        ('expense_comment', 'Expense Comment'),
        ('group_invitation', 'Group Invitation'),
        ('group_joined', 'Group Joined'),
        ('group_left', 'Group Left'),
        ('payment_due', 'Payment Due'),
        ('payment_received', 'Payment Received'),
        ('settlement_request', 'Settlement Request'),
        ('settlement_completed', 'Settlement Completed'),
        ('reminder', 'Reminder'),
        ('system', 'System Notification'),
        # Budget / envelope alerts
        ('budget_velocity_alert', 'Budget Velocity Alert'),
        ('budget_threshold_alert', 'Budget Threshold Alert'),
        ('budget_unassigned_reminder', 'Unassigned Budget Reminder'),
    ]
    
    PRIORITY_LEVELS = [
        ('low', 'Low'),
        ('normal', 'Normal'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    # Recipient
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    
    # Sender (can be null for system notifications)
    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='sent_notifications'
    )
    
    # Notification details
    notification_type = models.CharField(max_length=30, choices=NOTIFICATION_TYPES, db_index=True)
    title = models.CharField(max_length=200)
    message = models.TextField()
    
    # Priority and status
    priority = models.CharField(max_length=10, choices=PRIORITY_LEVELS, default='normal')
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Related objects (generic)
    related_object_type = models.CharField(max_length=50, blank=True)  # Model name
    related_object_id = models.CharField(max_length=100, blank=True)
    
    # Action URL or deep link
    action_url = models.URLField(blank=True)
    
    # Metadata for rich notifications
    metadata = models.JSONField(default=dict)
    
    # Delivery tracking
    is_sent = models.BooleanField(default=False)
    sent_at = models.DateTimeField(null=True, blank=True)
    delivery_channels = models.JSONField(default=list)  # ['email', 'push', 'sms']
    
    class Meta:
        db_table = 'notifications'
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read', 'created_at']),
            models.Index(fields=['notification_type', 'created_at']),
            models.Index(fields=['priority', 'is_sent']),
        ]
    
    def __str__(self):
        return f"{self.title} for {self.user.get_full_name()}"
    
    def mark_as_read(self):
        """Mark notification as read"""
        from django.utils import timezone
        
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])
    
    def mark_as_sent(self, channels=None):
        """Mark notification as sent"""
        from django.utils import timezone
        
        self.is_sent = True
        self.sent_at = timezone.now()
        if channels:
            self.delivery_channels = channels
        self.save(update_fields=['is_sent', 'sent_at', 'delivery_channels'])


class NotificationPreference(UUIDModel, TimeStampedModel):
    """
    Model for user notification preferences
    """
    DELIVERY_METHODS = [
        ('push', 'Push Notification'),
        ('email', 'Email'),
        ('sms', 'SMS'),
        ('in_app', 'In-App'),
    ]
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notification_preferences'
    )
    
    # Notification type this preference applies to
    notification_type = models.CharField(
        max_length=30,
        choices=Notification.NOTIFICATION_TYPES
    )
    
    # Delivery preferences
    is_enabled = models.BooleanField(default=True)
    delivery_methods = models.JSONField(default=list)  # List of enabled delivery methods
    
    # Timing preferences
    quiet_hours_start = models.TimeField(null=True, blank=True)  # e.g., 22:00
    quiet_hours_end = models.TimeField(null=True, blank=True)    # e.g., 08:00
    
    # Frequency limits
    frequency_limit = models.CharField(
        max_length=20,
        choices=[
            ('immediate', 'Immediate'),
            ('hourly', 'Hourly Digest'),
            ('daily', 'Daily Digest'),
            ('weekly', 'Weekly Digest'),
            ('never', 'Never'),
        ],
        default='immediate'
    )
    
    class Meta:
        db_table = 'notification_preferences'
        verbose_name = 'Notification Preference'
        verbose_name_plural = 'Notification Preferences'
        unique_together = ('user', 'notification_type')
        ordering = ['user', 'notification_type']
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.get_notification_type_display()}"


class NotificationTemplate(UUIDModel, TimeStampedModel):
    """
    Model for notification templates
    """
    TEMPLATE_TYPES = [
        ('email', 'Email Template'),
        ('push', 'Push Notification Template'),
        ('sms', 'SMS Template'),
        ('in_app', 'In-App Template'),
    ]
    
    # Template identification
    name = models.CharField(max_length=100, unique=True)
    notification_type = models.CharField(
        max_length=30,
        choices=Notification.NOTIFICATION_TYPES
    )
    template_type = models.CharField(max_length=10, choices=TEMPLATE_TYPES)
    
    # Template content
    subject = models.CharField(max_length=200, blank=True)  # For email templates
    body = models.TextField()
    
    # Template variables (for documentation)
    variables = models.JSONField(default=dict)  # Available template variables
    
    # Status
    is_active = models.BooleanField(default=True)
    
    # Localization
    language = models.CharField(max_length=10, default='en')
    
    class Meta:
        db_table = 'notification_templates'
        verbose_name = 'Notification Template'
        verbose_name_plural = 'Notification Templates'
        unique_together = ('notification_type', 'template_type', 'language')
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.get_template_type_display()})"
    
    def render(self, context):
        """Render template with context variables"""
        from django.template import Template, Context
        
        template = Template(self.body)
        rendered_body = template.render(Context(context))
        
        if self.subject:
            subject_template = Template(self.subject)
            rendered_subject = subject_template.render(Context(context))
            return rendered_subject, rendered_body
        
        return None, rendered_body


class NotificationLog(UUIDModel, TimeStampedModel):
    """
    Model for logging notification delivery attempts
    """
    DELIVERY_STATUS = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('delivered', 'Delivered'),
        ('failed', 'Failed'),
        ('bounced', 'Bounced'),
        ('opened', 'Opened'),
        ('clicked', 'Clicked'),
    ]
    
    notification = models.ForeignKey(
        Notification,
        on_delete=models.CASCADE,
        related_name='delivery_logs'
    )
    
    # Delivery details
    delivery_method = models.CharField(
        max_length=10,
        choices=NotificationPreference.DELIVERY_METHODS
    )
    recipient = models.CharField(max_length=255)  # email, phone, device_token
    
    # Status tracking
    status = models.CharField(max_length=20, choices=DELIVERY_STATUS, default='pending')
    external_id = models.CharField(max_length=255, blank=True)  # ID from delivery service
    
    # Timing
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    opened_at = models.DateTimeField(null=True, blank=True)
    clicked_at = models.DateTimeField(null=True, blank=True)
    
    # Error tracking
    error_message = models.TextField(blank=True)
    retry_count = models.IntegerField(default=0)
    
    # Metadata from delivery service
    metadata = models.JSONField(default=dict)
    
    class Meta:
        db_table = 'notification_logs'
        verbose_name = 'Notification Log'
        verbose_name_plural = 'Notification Logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['notification', 'delivery_method']),
            models.Index(fields=['status', 'sent_at']),
        ]
    
    def __str__(self):
        return f"{self.delivery_method} delivery of {self.notification.title}"
