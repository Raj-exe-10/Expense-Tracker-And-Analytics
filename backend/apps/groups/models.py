from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinLengthValidator, MaxLengthValidator
from apps.core.models import TimeStampedModel, UUIDModel, Currency
import uuid

User = get_user_model()


class Group(UUIDModel, TimeStampedModel):
    """
    Model representing a group for shared expenses
    """
    GROUP_TYPES = [
        ('personal', 'Personal'),
        ('trip', 'Trip'),
        ('home', 'Home/Apartment'),
        ('couple', 'Couple'),
        ('project', 'Project'),
        ('other', 'Other'),
    ]
    
    name = models.CharField(
        max_length=100,
        validators=[
            MinLengthValidator(2, "Group name must be at least 2 characters long"),
            MaxLengthValidator(100, "Group name cannot exceed 100 characters")
        ],
        db_index=True
    )
    description = models.TextField(blank=True)
    group_type = models.CharField(max_length=20, choices=GROUP_TYPES, default='other')
    
    # Group image
    image = models.ImageField(upload_to='group_images/', blank=True, null=True)
    
    # Group settings
    currency = models.ForeignKey(
        Currency,
        on_delete=models.PROTECT,
        related_name='groups'
    )
    
    # Privacy settings
    is_private = models.BooleanField(default=False)
    invite_code = models.CharField(max_length=12, unique=True, blank=True)
    
    # Group stats (denormalized for performance)
    member_count = models.PositiveIntegerField(default=0)
    total_expenses = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    settled_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Group status
    is_active = models.BooleanField(default=True)
    is_archived = models.BooleanField(default=False)
    archived_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'groups'
        verbose_name = 'Group'
        verbose_name_plural = 'Groups'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['name', 'is_active']),
            models.Index(fields=['invite_code']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.member_count} members)"
    
    def save(self, *args, **kwargs):
        if not self.invite_code:
            self.invite_code = self.generate_invite_code()
        super().save(*args, **kwargs)
    
    def generate_invite_code(self):
        """Generate a unique invite code for the group"""
        import string
        import random
        while True:
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
            if not Group.objects.filter(invite_code=code).exists():
                return code
    
    def get_admin_members(self):
        """Get all admin members of the group"""
        return self.memberships.filter(role='admin', is_active=True)
    
    def get_active_members(self):
        """Get all active members of the group"""
        return self.memberships.filter(is_active=True)
    
    def update_total_expenses(self):
        """Update the denormalized total_expenses field"""
        from apps.expenses.models import Expense
        from django.db.models import Sum
        from decimal import Decimal
        
        total = Expense.objects.filter(
            group=self
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
        
        self.total_expenses = total
        self.save(update_fields=['total_expenses'])
        return total
    
    def calculate_balances(self):
        """Calculate balances for all group members"""
        from apps.expenses.models import ExpenseShare
        from decimal import Decimal
        from django.db.models import Sum, Q
        
        balances = {}
        
        # Get all active members
        members = self.get_active_members().values_list('user_id', flat=True)
        
        for member_id in members:
            # Amount paid by this member
            paid = ExpenseShare.objects.filter(
                expense__group=self,
                paid_by_id=member_id
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
            
            # Amount owed by this member
            owed = ExpenseShare.objects.filter(
                expense__group=self,
                user_id=member_id
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
            
            balances[member_id] = paid - owed
        
        return balances


class GroupMembership(TimeStampedModel):
    """
    Model representing membership of a user in a group
    """
    MEMBER_ROLES = [
        ('admin', 'Admin'),
        ('member', 'Member'),
        ('viewer', 'Viewer'),  # Can only view, not add expenses
    ]
    
    INVITATION_STATUS = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
        ('left', 'Left'),
        ('removed', 'Removed'),
    ]
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='group_memberships'
    )
    group = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        related_name='memberships'
    )
    
    # Membership details
    role = models.CharField(max_length=20, choices=MEMBER_ROLES, default='member')
    status = models.CharField(max_length=20, choices=INVITATION_STATUS, default='pending')
    
    # Invitation details
    invited_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sent_group_invitations'
    )
    invitation_message = models.TextField(blank=True)
    
    # Status tracking
    is_active = models.BooleanField(default=True)
    joined_at = models.DateTimeField(null=True, blank=True)
    left_at = models.DateTimeField(null=True, blank=True)
    
    # Member preferences within group
    notification_preferences = models.JSONField(default=dict)
    
    class Meta:
        db_table = 'group_memberships'
        verbose_name = 'Group Membership'
        verbose_name_plural = 'Group Memberships'
        unique_together = ('user', 'group')
        ordering = ['joined_at']
        indexes = [
            models.Index(fields=['group', 'is_active']),
            models.Index(fields=['user', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.user.get_full_name()} in {self.group.name} ({self.role})"
    
    def accept_invitation(self):
        """Accept group invitation"""
        from django.utils import timezone
        
        self.status = 'accepted'
        self.is_active = True
        self.joined_at = timezone.now()
        self.save()
        
        # Update group member count
        self.group.member_count = self.group.memberships.filter(is_active=True).count()
        self.group.save(update_fields=['member_count'])
    
    def leave_group(self):
        """Leave the group"""
        from django.utils import timezone
        
        self.status = 'left'
        self.is_active = False
        self.left_at = timezone.now()
        self.save()
        
        # Update group member count
        self.group.member_count = self.group.memberships.filter(is_active=True).count()
        self.group.save(update_fields=['member_count'])


class GroupInvitation(UUIDModel, TimeStampedModel):
    """
    Model for tracking group invitations sent via email/phone
    """
    group = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        related_name='invitations'
    )
    invited_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='group_invitations_sent'
    )
    
    # Invitation details
    email = models.EmailField(blank=True)
    phone_number = models.CharField(max_length=17, blank=True)
    message = models.TextField(blank=True)
    
    # Status
    is_accepted = models.BooleanField(default=False)
    is_expired = models.BooleanField(default=False)
    accepted_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='accepted_group_invitations'
    )
    
    # Timestamps
    expires_at = models.DateTimeField()
    accepted_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'group_invitations'
        verbose_name = 'Group Invitation'
        verbose_name_plural = 'Group Invitations'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email', 'is_accepted']),
            models.Index(fields=['group', 'is_accepted']),
        ]
    
    def __str__(self):
        contact = self.email or self.phone_number
        return f"Invitation to {contact} for {self.group.name}"
    
    def is_valid(self):
        """Check if invitation is still valid"""
        from django.utils import timezone
        return not self.is_expired and not self.is_accepted and timezone.now() < self.expires_at
    
    def accept(self, user):
        """Accept the invitation"""
        from django.utils import timezone
        
        if not self.is_valid():
            raise ValueError("This invitation is no longer valid")
        
        # Create or update membership
        membership, created = GroupMembership.objects.get_or_create(
            user=user,
            group=self.group,
            defaults={
                'invited_by': self.invited_by,
                'invitation_message': self.message
            }
        )
        
        if not created and membership.status == 'left':
            # Re-joining the group
            membership.status = 'accepted'
            membership.is_active = True
            membership.joined_at = timezone.now()
            membership.save()
        elif created:
            membership.accept_invitation()
        
        # Mark invitation as accepted
        self.is_accepted = True
        self.accepted_by = user
        self.accepted_at = timezone.now()
        self.save()
        
        return membership


class GroupActivity(TimeStampedModel):
    """
    Model to track group activities for feed
    """
    ACTIVITY_TYPES = [
        ('member_joined', 'Member Joined'),
        ('member_left', 'Member Left'),
        ('expense_added', 'Expense Added'),
        ('expense_updated', 'Expense Updated'),
        ('expense_deleted', 'Expense Deleted'),
        ('payment_made', 'Payment Made'),
        ('group_updated', 'Group Updated'),
        ('settlement', 'Settlement'),
    ]
    
    group = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        related_name='activities'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='group_activities'
    )
    
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_TYPES, db_index=True)
    description = models.TextField()
    metadata = models.JSONField(default=dict)  # Store additional context
    
    class Meta:
        db_table = 'group_activities'
        verbose_name = 'Group Activity'
        verbose_name_plural = 'Group Activities'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['group', 'created_at']),
            models.Index(fields=['user', 'activity_type']),
        ]
    
    def __str__(self):
        return f"{self.user.get_full_name()}: {self.description}"
