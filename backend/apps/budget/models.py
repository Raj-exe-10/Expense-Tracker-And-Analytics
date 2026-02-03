"""
Budget (Envelope) models: Total Budget > Wallets > Categories.
"""
from django.db import models
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from apps.core.models import TimeStampedModel, UUIDModel, Category, Currency
from decimal import Decimal
import uuid

User = get_user_model()


class Wallet(TimeStampedModel, UUIDModel):
    """
    User-level wallet (envelope). Each wallet has a monthly limit or is a sinking fund.
    """
    WALLET_TYPES = [
        ('regular', 'Regular'),
        ('sinking_fund', 'Sinking Fund'),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='budget_wallets'
    )
    name = models.CharField(max_length=100)
    wallet_type = models.CharField(max_length=20, choices=WALLET_TYPES, default='regular')
    # For regular wallets: unused amount can roll to next month
    rollover_enabled = models.BooleanField(default=False)
    # Display order
    order = models.PositiveIntegerField(default=0)
    color = models.CharField(max_length=7, default='#4CAF50')
    icon = models.CharField(max_length=50, blank=True)

    class Meta:
        db_table = 'budget_wallets'
        verbose_name = 'Wallet'
        verbose_name_plural = 'Wallets'
        ordering = ['order', 'name']
        unique_together = [['user', 'name']]

    def __str__(self):
        return f"{self.name} ({self.user.get_full_name()})"


class WalletCategory(TimeStampedModel):
    """
    Assigns a system category to a wallet. Every category belongs to exactly one wallet per user.
    """
    wallet = models.ForeignKey(
        Wallet,
        on_delete=models.CASCADE,
        related_name='category_assignments'
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name='wallet_assignments'
    )

    class Meta:
        db_table = 'budget_wallet_categories'
        verbose_name = 'Wallet Category Assignment'
        verbose_name_plural = 'Wallet Category Assignments'
        unique_together = [['wallet', 'category']]

    def __str__(self):
        return f"{self.category.name} → {self.wallet.name}"

    def clean(self):
        if self.wallet and self.category_id:
            qs = WalletCategory.objects.filter(
                category_id=self.category_id,
                wallet__user=self.wallet.user
            )
            if self.wallet_id:
                qs = qs.exclude(wallet_id=self.wallet_id)
            if qs.exists():
                raise ValidationError(
                    {'category': 'This category is already assigned to another wallet.'}
                )


class UserCategory(TimeStampedModel, UUIDModel):
    """
    User-created category tied to a wallet. Shown with system categories in dropdowns.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='budget_categories'
    )
    wallet = models.ForeignKey(
        Wallet,
        on_delete=models.CASCADE,
        related_name='user_categories'
    )
    name = models.CharField(max_length=100)
    icon = models.CharField(max_length=50, blank=True)
    color = models.CharField(max_length=7, default='#9E9E9E')

    class Meta:
        db_table = 'budget_user_categories'
        verbose_name = 'User Category'
        verbose_name_plural = 'User Categories'
        ordering = ['name']
        unique_together = [['wallet', 'name']]

    def __str__(self):
        return f"{self.name} ({self.wallet.name})"


class MonthlyBudget(TimeStampedModel, UUIDModel):
    """
    Total monthly budget cap for a user (year/month).
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='monthly_budgets'
    )
    year = models.PositiveIntegerField(db_index=True)
    month = models.PositiveIntegerField(db_index=True)  # 1-12
    total_amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0'))],
        default=Decimal('0')
    )
    currency = models.ForeignKey(
        Currency,
        on_delete=models.PROTECT,
        related_name='monthly_budgets'
    )

    class Meta:
        db_table = 'budget_monthly_budgets'
        verbose_name = 'Monthly Budget'
        verbose_name_plural = 'Monthly Budgets'
        ordering = ['-year', '-month']
        unique_together = [['user', 'year', 'month']]

    def __str__(self):
        return f"{self.user.get_full_name()} {self.year}-{self.month:02d}"

    def allocated_amount(self):
        """Sum of all wallet allocation amounts for this budget."""
        return self.wallet_allocations.aggregate(
            total=models.Sum('amount')
        )['total'] or Decimal('0')

    @property
    def unassigned_amount(self):
        """Amount not yet assigned to any wallet."""
        return self.total_amount - self.allocated_amount()


class WalletAllocation(TimeStampedModel, UUIDModel):
    """
    Per-month allocation for a wallet: limit (regular) or monthly contribution (sinking fund).
    """
    monthly_budget = models.ForeignKey(
        MonthlyBudget,
        on_delete=models.CASCADE,
        related_name='wallet_allocations'
    )
    wallet = models.ForeignKey(
        Wallet,
        on_delete=models.CASCADE,
        related_name='allocations'
    )
    # For regular: monthly limit. For sinking_fund: monthly contribution.
    amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0'))],
        default=Decimal('0')
    )
    # Regular wallets with rollover: amount carried from previous month
    rollover_from_previous = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal('0'),
        validators=[MinValueValidator(Decimal('0'))]
    )
    # Sinking fund: running balance (persists across months)
    accumulated_balance = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal('0'),
        validators=[MinValueValidator(Decimal('0'))],
        help_text='For sinking funds: accumulated balance.'
    )

    class Meta:
        db_table = 'budget_wallet_allocations'
        verbose_name = 'Wallet Allocation'
        verbose_name_plural = 'Wallet Allocations'
        unique_together = [['monthly_budget', 'wallet']]

    def __str__(self):
        return f"{self.wallet.name} in {self.monthly_budget}"


class WalletAdjustment(TimeStampedModel, UUIDModel):
    """
    One-time "whammy" boost (or deduction) to a wallet for a given month.
    """
    monthly_budget = models.ForeignKey(
        MonthlyBudget,
        on_delete=models.CASCADE,
        related_name='wallet_adjustments'
    )
    wallet = models.ForeignKey(
        Wallet,
        on_delete=models.CASCADE,
        related_name='adjustments'
    )
    amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        help_text='Positive = boost, negative = deduction'
    )
    note = models.CharField(max_length=200, blank=True)

    class Meta:
        db_table = 'budget_wallet_adjustments'
        verbose_name = 'Wallet Adjustment'
        verbose_name_plural = 'Wallet Adjustments'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.wallet.name}: {self.amount} ({self.note or 'one-time'})"
