from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, FileExtensionValidator
from django.core.exceptions import ValidationError
from apps.core.models import TimeStampedModel, UUIDModel, Currency, Category, Tag
from apps.groups.models import Group, GroupMembership
from decimal import Decimal, ROUND_HALF_UP
import uuid
import os

User = get_user_model()


def validate_receipt_size(value):
    """Validate receipt file size (max 5MB)"""
    max_size = 5 * 1024 * 1024  # 5MB
    if value.size > max_size:
        raise ValidationError(f'File size cannot exceed {max_size / (1024*1024)}MB')


def validate_receipt_extension(value):
    """Validate receipt file extension"""
    ext = os.path.splitext(value.name)[1].lower()
    allowed_extensions = ['.jpg', '.jpeg', '.png', '.pdf']
    if ext not in allowed_extensions:
        raise ValidationError(f'File type not allowed. Allowed types: {", ".join(allowed_extensions)}')


class Expense(UUIDModel, TimeStampedModel):
    """
    Model representing an expense
    """
    EXPENSE_TYPES = [
        ('individual', 'Individual'),
        ('group', 'Group'),
        ('recurring', 'Recurring'),
    ]
    
    SPLIT_TYPES = [
        ('equal', 'Equal Split'),
        ('exact', 'Exact Amounts'),
        ('percentage', 'Percentage'),
        ('shares', 'Shares'),
        ('adjustment', 'Adjustment'),
    ]
    
    # Basic expense information
    title = models.CharField(max_length=200, db_index=True)
    description = models.TextField(blank=True)
    amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    currency = models.ForeignKey(
        Currency,
        on_delete=models.PROTECT,
        related_name='expenses'
    )
    
    # Expense categorization
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='expenses'
    )
    user_category = models.ForeignKey(
        'budget.UserCategory',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='expenses'
    )
    tags = models.ManyToManyField(
        Tag,
        blank=True,
        related_name='expenses'
    )
    
    # Expense context
    expense_type = models.CharField(max_length=20, choices=EXPENSE_TYPES, default='individual')
    group = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='expenses'
    )
    
    # Who paid for this expense
    paid_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='expenses_paid'
    )
    
    # Expense timing
    expense_date = models.DateField(db_index=True)
    
    # Splitting information
    split_type = models.CharField(max_length=20, choices=SPLIT_TYPES, default='equal')
    split_data = models.JSONField(default=dict, blank=True, null=True)  # Store split details
    
    # Receipt and attachments
    receipt = models.ImageField(
        upload_to='receipts/',
        blank=True,
        null=True,
        validators=[
            validate_receipt_size,
            validate_receipt_extension,
            FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'pdf'])
        ]
    )
    attachments = models.JSONField(default=list, blank=True, null=True)  # Store attachment URLs/paths
    
    # OCR and smart features
    ocr_data = models.JSONField(default=dict, blank=True, null=True)  # Store OCR extracted data
    vendor = models.CharField(max_length=200, blank=True)  # Merchant/vendor name
    location = models.CharField(max_length=200, blank=True)
    
    # Status and workflow
    is_settled = models.BooleanField(default=False)
    is_recurring = models.BooleanField(default=False)
    parent_expense = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='recurring_instances'
    )
    
    # Approval workflow (for groups with approval requirements)
    requires_approval = models.BooleanField(default=False)
    is_approved = models.BooleanField(default=True)
    approved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_expenses'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    
    # Soft delete
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    deleted_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='deleted_expenses'
    )
    
    class Meta:
        db_table = 'expenses'
        verbose_name = 'Expense'
        verbose_name_plural = 'Expenses'
        ordering = ['-expense_date', '-created_at']
        indexes = [
            models.Index(fields=['expense_date', 'group']),
            models.Index(fields=['paid_by', 'expense_date']),
            models.Index(fields=['category', 'expense_date']),
            models.Index(fields=['is_settled', 'group']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.currency.symbol}{self.amount}"
    
    def clean(self):
        super().clean()
        
        # Validate group expense rules
        if self.expense_type == 'group' and not self.group:
            raise ValidationError({'group': 'Group is required for group expenses'})
        
        if self.group and self.expense_type != 'group':
            raise ValidationError({'expense_type': 'Expense type must be "group" when group is specified'})
        
        # Validate paid_by is member of group
        if self.group:
            if not self.group.memberships.filter(user=self.paid_by, is_active=True).exists():
                raise ValidationError({'paid_by': 'Payer must be an active member of the group'})
    
    def save(self, *args, **kwargs):
        self.full_clean()
        
        # Auto-approve individual expenses
        if self.expense_type == 'individual':
            self.is_approved = True
            self.approved_by = self.paid_by
            if not self.approved_at:
                from django.utils import timezone
                self.approved_at = timezone.now()
        
        super().save(*args, **kwargs)
        
        # Create expense shares after saving
        # Only auto-create if shares don't already exist (to avoid duplicates)
        if not hasattr(self, '_skip_share_creation') and not self.shares.exists():
            self.create_expense_shares()
    
    def create_expense_shares(self):
        """Create expense shares based on split type"""
        if self.expense_type == 'individual':
            # For individual expenses, only the payer owes money
            ExpenseShare.objects.get_or_create(
                expense=self,
                user=self.paid_by,
                defaults={
                    'amount': self.amount,
                    'paid_by': self.paid_by,
                    'currency': self.currency
                }
            )
        elif self.expense_type == 'group' and self.group:
            self._create_group_expense_shares()
    
    def _create_group_expense_shares(self):
        """Create shares for group expenses based on split type"""
        active_members = self.group.get_active_members()
        
        if self.split_type == 'equal':
            share_amount = (self.amount / len(active_members)).quantize(
                Decimal('0.01'), rounding=ROUND_HALF_UP
            )
            
            for membership in active_members:
                ExpenseShare.objects.get_or_create(
                    expense=self,
                    user=membership.user,
                    defaults={
                        'amount': share_amount,
                        'paid_by': self.paid_by,
                        'currency': self.currency
                    }
                )
        
        elif self.split_type == 'exact':
            # Use amounts from split_data
            for user_id, amount in self.split_data.items():
                try:
                    user = User.objects.get(id=user_id)
                    ExpenseShare.objects.get_or_create(
                        expense=self,
                        user=user,
                        defaults={
                            'amount': Decimal(str(amount)),
                            'paid_by': self.paid_by,
                            'currency': self.currency
                        }
                    )
                except (User.DoesNotExist, ValueError):
                    continue
        
        # Similar logic for percentage and shares...
    
    def get_total_shares(self):
        """Get total amount of all shares"""
        return self.shares.aggregate(
            total=models.Sum('amount')
        )['total'] or Decimal('0')
    
    def is_fully_shared(self):
        """Check if the expense is fully allocated to shares"""
        return abs(self.amount - self.get_total_shares()) < Decimal('0.01')
    
    def get_user_share(self, user):
        """Get a specific user's share of this expense"""
        try:
            return self.shares.get(user=user)
        except ExpenseShare.DoesNotExist:
            return None
    
    def update_split(self, split_type, split_data):
        """Update the expense split and recreate shares"""
        self.split_type = split_type
        self.split_data = split_data
        self.save()
        
        # Delete existing shares and recreate
        self.shares.all().delete()
        self.create_expense_shares()


class ExpenseShare(UUIDModel, TimeStampedModel):
    """
    Model representing a user's share of an expense
    """
    expense = models.ForeignKey(
        Expense,
        on_delete=models.CASCADE,
        related_name='shares'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='expense_shares'
    )
    
    # Share details
    amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    currency = models.ForeignKey(
        Currency,
        on_delete=models.PROTECT,
        related_name='expense_shares'
    )
    
    # Payment details
    paid_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='paid_expense_shares'
    )
    
    # Settlement status
    is_settled = models.BooleanField(default=False)
    settled_at = models.DateTimeField(null=True, blank=True)
    settlement = models.ForeignKey(
        'payments.Settlement',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='expense_shares'
    )
    
    class Meta:
        db_table = 'expense_shares'
        verbose_name = 'Expense Share'
        verbose_name_plural = 'Expense Shares'
        unique_together = ('expense', 'user')
        ordering = ['expense__expense_date', 'user__first_name']
        indexes = [
            models.Index(fields=['user', 'is_settled']),
            models.Index(fields=['paid_by', 'is_settled']),
            models.Index(fields=['expense', 'user']),
        ]
    
    def __str__(self):
        return f"{self.user.get_full_name()}'s share of {self.expense.title}"
    
    @property
    def is_owed_by_user(self):
        """Check if this share is owed by the user (user didn't pay)"""
        return self.user != self.paid_by
    
    @property
    def net_amount(self):
        """Net amount (positive if owed to user, negative if owed by user)"""
        if self.user == self.paid_by:
            return self.amount
        else:
            return -self.amount


class RecurringExpense(UUIDModel, TimeStampedModel):
    """
    Model for managing recurring expenses
    """
    FREQUENCY_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('biweekly', 'Bi-weekly'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('yearly', 'Yearly'),
    ]
    
    # Basic information (template for recurring expenses)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    currency = models.ForeignKey(
        Currency,
        on_delete=models.PROTECT,
        related_name='recurring_expenses'
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='recurring_expenses'
    )
    
    # Recurrence settings
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES)
    interval = models.PositiveIntegerField(default=1)  # Every N intervals
    
    # Context
    group = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='recurring_expenses'
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='created_recurring_expenses'
    )
    paid_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='recurring_expenses_to_pay'
    )
    
    # Schedule
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    next_due_date = models.DateField(db_index=True)
    
    # Splitting (same as regular expenses)
    split_type = models.CharField(max_length=20, choices=Expense.SPLIT_TYPES, default='equal')
    split_data = models.JSONField(default=dict)
    
    # Status
    is_active = models.BooleanField(default=True)
    is_paused = models.BooleanField(default=False)
    paused_until = models.DateField(null=True, blank=True)
    
    class Meta:
        db_table = 'recurring_expenses'
        verbose_name = 'Recurring Expense'
        verbose_name_plural = 'Recurring Expenses'
        ordering = ['next_due_date', 'title']
        indexes = [
            models.Index(fields=['next_due_date', 'is_active']),
            models.Index(fields=['group', 'is_active']),
            models.Index(fields=['created_by', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.get_frequency_display()})"
    
    def get_next_due_date(self):
        """Get the next due date (alias for next_due_date field)"""
        return self.next_due_date
    
    def create_next_expense(self):
        """Create the next expense instance from this template"""
        if not self.is_active or self.is_paused:
            return None
        
        if self.end_date and self.next_due_date > self.end_date:
            self.is_active = False
            self.save()
            return None
        
        # Create new expense
        expense = Expense.objects.create(
            title=self.title,
            description=self.description,
            amount=self.amount,
            currency=self.currency,
            category=self.category,
            expense_type='group' if self.group else 'individual',
            group=self.group,
            paid_by=self.paid_by,
            expense_date=self.next_due_date,
            split_type=self.split_type,
            split_data=self.split_data,
            is_recurring=True,
            parent_expense=None  # Could link back to recurring expense
        )
        
        # Update next due date
        self.next_due_date = self.calculate_next_date()
        self.save()
        
        return expense
    
    def calculate_next_date(self):
        """Calculate the next due date based on frequency"""
        from datetime import timedelta
        from dateutil.relativedelta import relativedelta
        
        current_date = self.next_due_date
        
        if self.frequency == 'daily':
            return current_date + timedelta(days=self.interval)
        elif self.frequency == 'weekly':
            return current_date + timedelta(weeks=self.interval)
        elif self.frequency == 'biweekly':
            return current_date + timedelta(weeks=2 * self.interval)
        elif self.frequency == 'monthly':
            return current_date + relativedelta(months=self.interval)
        elif self.frequency == 'quarterly':
            return current_date + relativedelta(months=3 * self.interval)
        elif self.frequency == 'yearly':
            return current_date + relativedelta(years=self.interval)
        
        return current_date


class ExpenseComment(UUIDModel, TimeStampedModel):
    """
    Model for comments on expenses
    """
    expense = models.ForeignKey(
        Expense,
        on_delete=models.CASCADE,
        related_name='comments'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='expense_comments'
    )
    
    comment = models.TextField()
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='replies'
    )
    
    # Status
    is_edited = models.BooleanField(default=False)
    edited_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'expense_comments'
        verbose_name = 'Expense Comment'
        verbose_name_plural = 'Expense Comments'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['expense', 'created_at']),
            models.Index(fields=['user', 'created_at']),
        ]
    
    def __str__(self):
        return f"Comment by {self.user.get_full_name()} on {self.expense.title}"
