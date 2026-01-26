from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator
from apps.core.models import TimeStampedModel, UUIDModel, Currency
from apps.groups.models import Group
from decimal import Decimal
import uuid

User = get_user_model()


class PaymentMethod(UUIDModel, TimeStampedModel):
    """
    Model to store user payment methods
    """
    PAYMENT_TYPES = [
        ('bank', 'Bank Transfer'),
        ('paypal', 'PayPal'),
        ('stripe', 'Credit/Debit Card'),
        ('venmo', 'Venmo'),
        ('cash', 'Cash'),
        ('crypto', 'Cryptocurrency'),
        ('other', 'Other'),
    ]
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='payment_methods'
    )
    
    # Payment method details
    method_type = models.CharField(max_length=20, choices=PAYMENT_TYPES)
    name = models.CharField(max_length=100)  # Display name
    details = models.JSONField(default=dict)  # Store method-specific details
    
    # External service details
    external_id = models.CharField(max_length=255, blank=True)  # ID from payment service
    metadata = models.JSONField(default=dict)
    
    # Status
    is_active = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)
    is_default = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'payment_methods'
        verbose_name = 'Payment Method'
        verbose_name_plural = 'Payment Methods'
        ordering = ['-is_default', '-created_at']
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['method_type', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.name}"
    
    def save(self, *args, **kwargs):
        # Ensure only one default payment method per user
        if self.is_default:
            PaymentMethod.objects.filter(
                user=self.user,
                is_default=True
            ).exclude(id=self.id).update(is_default=False)
        
        super().save(*args, **kwargs)


class Settlement(UUIDModel, TimeStampedModel):
    """
    Model representing a settlement between users
    """
    SETTLEMENT_STATUS = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
        ('disputed', 'Disputed'),
    ]
    
    SETTLEMENT_METHODS = [
        ('manual', 'Manual'),
        ('automatic', 'Automatic'),
        ('external', 'External Payment'),
    ]
    
    # Settlement parties
    payer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='settlements_to_pay'
    )
    payee = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='settlements_to_receive'
    )
    
    # Settlement details
    amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    currency = models.ForeignKey(
        Currency,
        on_delete=models.PROTECT,
        related_name='settlements'
    )
    
    # Context
    group = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='settlements'
    )
    
    # Settlement method and status
    method = models.CharField(max_length=20, choices=SETTLEMENT_METHODS, default='manual')
    status = models.CharField(max_length=20, choices=SETTLEMENT_STATUS, default='pending')
    
    # Payment details
    payment_method = models.ForeignKey(
        PaymentMethod,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='settlements'
    )
    
    # External payment service details
    external_transaction_id = models.CharField(max_length=255, blank=True)
    payment_service = models.CharField(max_length=50, blank=True)  # stripe, paypal, etc.
    payment_metadata = models.JSONField(default=dict)
    
    # Settlement timing
    due_date = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Notes and communication
    description = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    
    # Confirmation
    is_confirmed_by_payer = models.BooleanField(default=False)
    is_confirmed_by_payee = models.BooleanField(default=False)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'settlements'
        verbose_name = 'Settlement'
        verbose_name_plural = 'Settlements'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['payer', 'status']),
            models.Index(fields=['payee', 'status']),
            models.Index(fields=['group', 'status']),
            models.Index(fields=['status', 'due_date']),
        ]
    
    def __str__(self):
        return f"{self.payer.get_full_name()} owes {self.currency.symbol}{self.amount} to {self.payee.get_full_name()}"
    
    @property
    def is_confirmed(self):
        """Check if settlement is confirmed by both parties"""
        return self.is_confirmed_by_payer and self.is_confirmed_by_payee
    
    def confirm_by_payer(self):
        """Confirm settlement by payer"""
        self.is_confirmed_by_payer = True
        if self.is_confirmed_by_payee:
            self.mark_as_confirmed()
        self.save()
    
    def confirm_by_payee(self):
        """Confirm settlement by payee"""
        self.is_confirmed_by_payee = True
        if self.is_confirmed_by_payer:
            self.mark_as_confirmed()
        self.save()
    
    def mark_as_confirmed(self):
        """Mark settlement as confirmed by both parties"""
        from django.utils import timezone
        
        self.status = 'completed'
        self.confirmed_at = timezone.now()
        self.completed_at = timezone.now()
    
    def mark_as_completed(self):
        """Mark settlement as completed"""
        from django.utils import timezone
        
        self.status = 'completed'
        self.completed_at = timezone.now()
        self.save()
        
        # Mark related expense shares as settled
        # Find expense shares related to this settlement (payer and payee)
        from apps.expenses.models import ExpenseShare
        ExpenseShare.objects.filter(
            expense__group=self.group if self.group else None,
            user=self.payee,
            paid_by=self.payer,
            is_settled=False
        ).update(
            is_settled=True,
            settled_at=timezone.now(),
            settlement=self
        )


class Payment(UUIDModel, TimeStampedModel):
    """
    Model representing individual payments made through the platform
    """
    PAYMENT_STATUS = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
        ('cancelled', 'Cancelled'),
    ]
    
    # Payment details
    settlement = models.ForeignKey(
        Settlement,
        on_delete=models.CASCADE,
        related_name='payments'
    )
    
    amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    currency = models.ForeignKey(
        Currency,
        on_delete=models.PROTECT,
        related_name='payments'
    )
    
    # Payment processing
    payment_method = models.ForeignKey(
        PaymentMethod,
        on_delete=models.PROTECT,
        related_name='payments'
    )
    
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS, default='pending')
    
    # External service details
    external_transaction_id = models.CharField(max_length=255, unique=True)
    payment_service = models.CharField(max_length=50)  # stripe, paypal, etc.
    
    # Processing details
    processing_fee = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal('0'),
        validators=[MinValueValidator(Decimal('0'))]
    )
    
    # Timestamps
    initiated_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    # Metadata from payment service
    metadata = models.JSONField(default=dict)
    
    # Error tracking
    error_code = models.CharField(max_length=100, blank=True)
    error_message = models.TextField(blank=True)
    
    class Meta:
        db_table = 'payments'
        verbose_name = 'Payment'
        verbose_name_plural = 'Payments'
        ordering = ['-initiated_at']
        indexes = [
            models.Index(fields=['status', 'initiated_at']),
            models.Index(fields=['external_transaction_id']),
            models.Index(fields=['settlement', 'status']),
        ]
    
    def __str__(self):
        return f"Payment of {self.currency.symbol}{self.amount} via {self.payment_service}"


class PaymentWebhook(UUIDModel, TimeStampedModel):
    """
    Model to track webhook events from payment services
    """
    WEBHOOK_SERVICES = [
        ('stripe', 'Stripe'),
        ('paypal', 'PayPal'),
        ('venmo', 'Venmo'),
    ]
    
    WEBHOOK_STATUS = [
        ('received', 'Received'),
        ('processing', 'Processing'),
        ('processed', 'Processed'),
        ('failed', 'Failed'),
        ('ignored', 'Ignored'),
    ]
    
    # Webhook details
    service = models.CharField(max_length=20, choices=WEBHOOK_SERVICES)
    event_id = models.CharField(max_length=255, unique=True)
    event_type = models.CharField(max_length=100)
    
    # Payload
    raw_payload = models.JSONField()
    processed_payload = models.JSONField(default=dict)
    
    # Processing
    status = models.CharField(max_length=20, choices=WEBHOOK_STATUS, default='received')
    processed_at = models.DateTimeField(null=True, blank=True)
    
    # Related objects
    payment = models.ForeignKey(
        Payment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='webhooks'
    )
    
    # Error tracking
    error_message = models.TextField(blank=True)
    retry_count = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'payment_webhooks'
        verbose_name = 'Payment Webhook'
        verbose_name_plural = 'Payment Webhooks'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['service', 'event_type']),
            models.Index(fields=['status', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.service} webhook: {self.event_type}"
