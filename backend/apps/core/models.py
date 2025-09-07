from django.db import models
from django.contrib.auth import get_user_model
from decimal import Decimal
import uuid


class TimeStampedModel(models.Model):
    """
    Abstract base class that provides created_at and updated_at fields
    """
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True


class UUIDModel(models.Model):
    """
    Abstract base class that provides UUID primary key
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    class Meta:
        abstract = True


class Currency(TimeStampedModel):
    """
    Model to store currency information
    """
    code = models.CharField(max_length=3, unique=True, db_index=True)  # USD, EUR, etc.
    name = models.CharField(max_length=50)
    symbol = models.CharField(max_length=10)
    decimal_places = models.PositiveIntegerField(default=2)
    exchange_rate_to_usd = models.DecimalField(max_digits=20, decimal_places=10, default=1)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'currencies'
        verbose_name = 'Currency'
        verbose_name_plural = 'Currencies'
        ordering = ['code']
    
    def __str__(self):
        return f"{self.code} - {self.name}"
    
    def convert_to_usd(self, amount):
        """Convert amount from this currency to USD"""
        return Decimal(str(amount)) * self.exchange_rate_to_usd
    
    def convert_from_usd(self, usd_amount):
        """Convert USD amount to this currency"""
        if self.exchange_rate_to_usd == 0:
            return Decimal('0')
        return Decimal(str(usd_amount)) / self.exchange_rate_to_usd


class Category(TimeStampedModel):
    """
    Model to store expense categories
    """
    name = models.CharField(max_length=100, unique=True, db_index=True)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True)  # Font Awesome icon class
    color = models.CharField(max_length=7, default='#007bff')  # Hex color
    is_default = models.BooleanField(default=False)  # System-wide default categories
    parent = models.ForeignKey(
        'self', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True, 
        related_name='subcategories'
    )
    
    class Meta:
        db_table = 'categories'
        verbose_name = 'Category'
        verbose_name_plural = 'Categories'
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    def get_full_name(self):
        """Get full category name including parent"""
        if self.parent:
            return f"{self.parent.name} > {self.name}"
        return self.name


class Country(TimeStampedModel):
    """
    Model to store country information
    """
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=2, unique=True)  # ISO 3166-1 alpha-2
    currency = models.ForeignKey(
        Currency, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='countries'
    )
    phone_code = models.CharField(max_length=10, blank=True)
    flag_emoji = models.CharField(max_length=10, blank=True)
    
    class Meta:
        db_table = 'countries'
        verbose_name = 'Country'
        verbose_name_plural = 'Countries'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.flag_emoji} {self.name}"


class Tag(TimeStampedModel):
    """
    Model for tags that can be applied to expenses
    """
    name = models.CharField(max_length=50, unique=True, db_index=True)
    color = models.CharField(max_length=7, default='#6c757d')  # Hex color
    description = models.TextField(blank=True)
    usage_count = models.PositiveIntegerField(default=0)
    
    class Meta:
        db_table = 'tags'
        verbose_name = 'Tag'
        verbose_name_plural = 'Tags'
        ordering = ['-usage_count', 'name']
    
    def __str__(self):
        return self.name


class SystemConfiguration(TimeStampedModel):
    """
    Model to store system-wide configuration settings
    """
    key = models.CharField(max_length=100, unique=True, db_index=True)
    value = models.TextField()
    data_type = models.CharField(
        max_length=20,
        choices=[
            ('string', 'String'),
            ('integer', 'Integer'),
            ('float', 'Float'),
            ('boolean', 'Boolean'),
            ('json', 'JSON'),
        ],
        default='string'
    )
    description = models.TextField(blank=True)
    is_sensitive = models.BooleanField(default=False)  # For passwords, API keys, etc.
    
    class Meta:
        db_table = 'system_configurations'
        verbose_name = 'System Configuration'
        verbose_name_plural = 'System Configurations'
        ordering = ['key']
    
    def __str__(self):
        return f"{self.key}: {self.value if not self.is_sensitive else '***'}"
    
    def get_value(self):
        """Get the value converted to appropriate Python type"""
        if self.data_type == 'integer':
            return int(self.value)
        elif self.data_type == 'float':
            return float(self.value)
        elif self.data_type == 'boolean':
            return self.value.lower() in ('true', '1', 'yes', 'on')
        elif self.data_type == 'json':
            import json
            return json.loads(self.value)
        return self.value


class ActivityLog(TimeStampedModel):
    """
    Model to log user activities for audit trail
    """
    ACTION_TYPES = [
        ('create', 'Created'),
        ('update', 'Updated'),
        ('delete', 'Deleted'),
        ('login', 'Logged In'),
        ('logout', 'Logged Out'),
        ('export', 'Exported Data'),
        ('payment', 'Payment Made'),
    ]
    
    user = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='activity_logs'
    )
    action = models.CharField(max_length=20, choices=ACTION_TYPES, db_index=True)
    content_type = models.CharField(max_length=50, blank=True)  # Model name
    object_id = models.CharField(max_length=100, blank=True)
    object_repr = models.CharField(max_length=200, blank=True)
    changes = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    class Meta:
        db_table = 'activity_logs'
        verbose_name = 'Activity Log'
        verbose_name_plural = 'Activity Logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'action', 'created_at']),
            models.Index(fields=['content_type', 'object_id']),
        ]
    
    def __str__(self):
        user_name = self.user.get_full_name() if self.user else 'System'
        return f"{user_name} {self.get_action_display()} {self.object_repr} at {self.created_at}"
