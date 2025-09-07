from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator
from apps.core.models import TimeStampedModel


def default_dict():
    return {}


def default_list():
    return []


class User(AbstractUser, TimeStampedModel):
    """
    Custom User model extending Django's AbstractUser
    """
    USER_ROLES = [
        ('user', 'Regular User'),
        ('premium', 'Premium User'),
        ('admin', 'Administrator'),
    ]
    
    email = models.EmailField(unique=True, db_index=True)
    phone_number = models.CharField(
        max_length=17,
        blank=True,
        validators=[
            RegexValidator(
                regex=r'^\+?1?\d{9,15}$',
                message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
            )
        ]
    )
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    bio = models.TextField(max_length=500, blank=True)
    date_of_birth = models.DateField(blank=True, null=True)
    
    # User preferences
    preferred_currency = models.CharField(max_length=3, default='USD')
    timezone = models.CharField(max_length=50, default='UTC')
    user_notification_preferences = models.JSONField(default=default_dict, blank=True)
    
    # User role and status
    role = models.CharField(max_length=20, choices=USER_ROLES, default='user')
    is_verified = models.BooleanField(default=False)
    is_premium = models.BooleanField(default=False)
    
    # Privacy settings
    profile_visibility = models.CharField(
        max_length=20,
        choices=[
            ('public', 'Public'),
            ('friends', 'Friends Only'),
            ('private', 'Private')
        ],
        default='friends'
    )
    
    # Tracking fields
    last_login_ip = models.GenericIPAddressField(blank=True, null=True)
    failed_login_attempts = models.IntegerField(default=0)
    account_locked_until = models.DateTimeField(blank=True, null=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']
    
    class Meta:
        db_table = 'auth_user'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.email})"
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip() or self.username
    
    def get_short_name(self):
        return self.first_name or self.username
    
    @property
    def is_account_locked(self):
        """Check if account is currently locked"""
        if self.account_locked_until:
            from django.utils import timezone
            return timezone.now() < self.account_locked_until
        return False
    
    def unlock_account(self):
        """Unlock user account"""
        self.failed_login_attempts = 0
        self.account_locked_until = None
        self.save(update_fields=['failed_login_attempts', 'account_locked_until'])


class UserProfile(TimeStampedModel):
    """
    Extended user profile information
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    
    # Professional information
    occupation = models.CharField(max_length=100, blank=True)
    company = models.CharField(max_length=100, blank=True)
    website = models.URLField(blank=True)
    
    # Location
    country = models.CharField(max_length=50, blank=True)
    city = models.CharField(max_length=50, blank=True)
    
    # Social links
    social_links = models.JSONField(default=default_dict, blank=True)
    
    # Statistics
    total_expenses = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_groups = models.IntegerField(default=0)
    expense_count = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'user_profiles'
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'
    
    def __str__(self):
        return f"Profile of {self.user.get_full_name()}"


class UserFriendship(TimeStampedModel):
    """
    Model to handle friendships between users
    """
    FRIENDSHIP_STATUS = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('blocked', 'Blocked'),
        ('declined', 'Declined'),
    ]
    
    from_user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='friendship_requests_sent'
    )
    to_user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='friendship_requests_received'
    )
    status = models.CharField(max_length=20, choices=FRIENDSHIP_STATUS, default='pending')
    message = models.TextField(blank=True)
    
    class Meta:
        db_table = 'user_friendships'
        unique_together = ('from_user', 'to_user')
        verbose_name = 'User Friendship'
        verbose_name_plural = 'User Friendships'
    
    def __str__(self):
        return f"{self.from_user} -> {self.to_user} ({self.status})"


class UserDevice(TimeStampedModel):
    """
    Model to track user devices for notifications
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='devices')
    device_token = models.CharField(max_length=255, unique=True)
    device_type = models.CharField(
        max_length=20,
        choices=[
            ('ios', 'iOS'),
            ('android', 'Android'),
            ('web', 'Web')
        ]
    )
    device_name = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    last_used = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_devices'
        verbose_name = 'User Device'
        verbose_name_plural = 'User Devices'
    
    def __str__(self):
        return f"{self.user.username} - {self.device_type} - {self.device_name}"


class EmailVerification(TimeStampedModel):
    """
    Model to handle email verification tokens
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='email_verifications')
    token = models.CharField(max_length=100, unique=True)
    email = models.EmailField()
    is_used = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    
    class Meta:
        db_table = 'email_verifications'
        verbose_name = 'Email Verification'
        verbose_name_plural = 'Email Verifications'
    
    def __str__(self):
        return f"Verification for {self.email}"
    
    def is_expired(self):
        from django.utils import timezone
        return timezone.now() > self.expires_at
