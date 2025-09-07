from django.db import models
from django.contrib.auth import get_user_model
from apps.core.models import TimeStampedModel, UUIDModel, Currency, Category
from apps.groups.models import Group
from decimal import Decimal
import uuid

User = get_user_model()


class ExpenseAnalytics(UUIDModel, TimeStampedModel):
    """
    Model for storing pre-calculated expense analytics
    """
    PERIOD_TYPES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('yearly', 'Yearly'),
    ]
    
    # Scope of analytics
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='expense_analytics'
    )
    group = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='expense_analytics'
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='expense_analytics'
    )
    
    # Time period
    period_type = models.CharField(max_length=20, choices=PERIOD_TYPES)
    period_start = models.DateField(db_index=True)
    period_end = models.DateField(db_index=True)
    
    # Analytics data
    total_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    currency = models.ForeignKey(
        Currency,
        on_delete=models.PROTECT,
        related_name='analytics'
    )
    
    expense_count = models.IntegerField(default=0)
    average_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Category breakdown (JSON)
    category_breakdown = models.JSONField(default=dict)
    
    # Trend indicators
    trend_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        help_text="Percentage change from previous period"
    )
    
    class Meta:
        db_table = 'expense_analytics'
        verbose_name = 'Expense Analytics'
        verbose_name_plural = 'Expense Analytics'
        ordering = ['-period_start']
        indexes = [
            models.Index(fields=['user', 'period_type', 'period_start']),
            models.Index(fields=['group', 'period_type', 'period_start']),
            models.Index(fields=['category', 'period_start']),
        ]
        unique_together = [
            ('user', 'group', 'category', 'period_type', 'period_start'),
        ]
    
    def __str__(self):
        scope = self.user.get_full_name() if self.user else str(self.group)
        return f"{scope} - {self.get_period_type_display()} ({self.period_start})"


class UserSpendingPattern(UUIDModel, TimeStampedModel):
    """
    Model for tracking user spending patterns and habits
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='spending_patterns'
    )
    
    # Analysis period
    analysis_date = models.DateField(db_index=True)
    
    # Spending patterns
    most_active_day = models.CharField(max_length=10, blank=True)  # monday, tuesday, etc.
    most_active_hour = models.IntegerField(null=True, blank=True)  # 0-23
    
    # Category preferences
    top_categories = models.JSONField(default=list)  # List of category IDs by spending
    category_distribution = models.JSONField(default=dict)  # Category -> percentage
    
    # Behavioral metrics
    average_expense_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    expense_frequency = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # per day
    
    # Group activity
    group_vs_individual_ratio = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    most_active_groups = models.JSONField(default=list)
    
    # Seasonal trends
    seasonal_spending = models.JSONField(default=dict)  # Month -> average spending
    
    class Meta:
        db_table = 'user_spending_patterns'
        verbose_name = 'User Spending Pattern'
        verbose_name_plural = 'User Spending Patterns'
        ordering = ['-analysis_date']
        unique_together = ('user', 'analysis_date')
    
    def __str__(self):
        return f"{self.user.get_full_name()} spending pattern ({self.analysis_date})"


class ReportTemplate(UUIDModel, TimeStampedModel):
    """
    Model for storing custom report templates
    """
    REPORT_TYPES = [
        ('expense_summary', 'Expense Summary'),
        ('group_analysis', 'Group Analysis'),
        ('category_breakdown', 'Category Breakdown'),
        ('trend_analysis', 'Trend Analysis'),
        ('settlement_report', 'Settlement Report'),
        ('custom', 'Custom Report'),
    ]
    
    OUTPUT_FORMATS = [
        ('pdf', 'PDF'),
        ('csv', 'CSV'),
        ('excel', 'Excel'),
        ('json', 'JSON'),
    ]
    
    # Template details
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    report_type = models.CharField(max_length=30, choices=REPORT_TYPES)
    
    # Template owner
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='created_report_templates'
    )
    
    # Template configuration
    filters = models.JSONField(default=dict)  # Date ranges, categories, etc.
    fields = models.JSONField(default=list)   # Fields to include in report
    grouping = models.JSONField(default=dict) # How to group data
    sorting = models.JSONField(default=dict)  # Sorting preferences
    
    # Formatting
    output_format = models.CharField(max_length=10, choices=OUTPUT_FORMATS, default='pdf')
    styling = models.JSONField(default=dict)  # Colors, fonts, etc.
    
    # Sharing and permissions
    is_public = models.BooleanField(default=False)
    shared_with_users = models.ManyToManyField(
        User,
        blank=True,
        related_name='shared_report_templates'
    )
    shared_with_groups = models.ManyToManyField(
        Group,
        blank=True,
        related_name='shared_report_templates'
    )
    
    # Usage tracking
    usage_count = models.IntegerField(default=0)
    last_used = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'report_templates'
        verbose_name = 'Report Template'
        verbose_name_plural = 'Report Templates'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['created_by', 'report_type']),
            models.Index(fields=['is_public', 'usage_count']),
        ]
    
    def __str__(self):
        return f"{self.name} by {self.created_by.get_full_name()}"


class GeneratedReport(UUIDModel, TimeStampedModel):
    """
    Model for tracking generated reports
    """
    GENERATION_STATUS = [
        ('queued', 'Queued'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('expired', 'Expired'),
    ]
    
    # Report details
    template = models.ForeignKey(
        ReportTemplate,
        on_delete=models.CASCADE,
        related_name='generated_reports'
    )
    
    generated_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='generated_reports'
    )
    
    # Generation parameters
    parameters = models.JSONField(default=dict)  # Runtime parameters
    
    # Status and timing
    status = models.CharField(max_length=20, choices=GENERATION_STATUS, default='queued')
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    # Output
    file_path = models.CharField(max_length=500, blank=True)
    file_size = models.BigIntegerField(null=True, blank=True)  # in bytes
    download_count = models.IntegerField(default=0)
    
    # Error tracking
    error_message = models.TextField(blank=True)
    
    class Meta:
        db_table = 'generated_reports'
        verbose_name = 'Generated Report'
        verbose_name_plural = 'Generated Reports'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['generated_by', 'status']),
            models.Index(fields=['status', 'expires_at']),
        ]
    
    def __str__(self):
        return f"{self.template.name} generated for {self.generated_by.get_full_name()}"
    
    def is_expired(self):
        """Check if report has expired"""
        if self.expires_at:
            from django.utils import timezone
            return timezone.now() > self.expires_at
        return False
