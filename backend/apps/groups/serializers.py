from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from decimal import Decimal

from .models import Group, GroupMembership, GroupInvitation, GroupActivity
from apps.core.serializers import CurrencySerializer
from apps.authentication.serializers import SimpleUserSerializer

User = get_user_model()


class GroupSerializer(serializers.ModelSerializer):
    """Group serializer"""
    
    currency_details = CurrencySerializer(source='currency', read_only=True)
    member_count = serializers.IntegerField(read_only=True)
    total_expenses = serializers.SerializerMethodField()
    user_role = serializers.SerializerMethodField()
    user_balance = serializers.SerializerMethodField()
    recent_activity = serializers.SerializerMethodField()
    
    class Meta:
        model = Group
        fields = [
            'id', 'name', 'description', 'group_type', 'image',
            'currency', 'currency_details', 'is_private', 'invite_code',
            'member_count', 'total_expenses', 'settled_amount',
            'is_active', 'is_archived', 'user_role', 'user_balance',
            'recent_activity', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'invite_code', 'member_count', 'total_expenses',
            'settled_amount', 'created_at', 'updated_at'
        ]
    
    def get_total_expenses(self, obj):
        """Calculate total expenses for the group dynamically"""
        from apps.expenses.models import Expense
        from django.db.models import Sum
        
        total = Expense.objects.filter(
            group=obj
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
        return str(total)
    
    def get_user_role(self, obj):
        """Get current user's role in the group"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                membership = obj.memberships.get(user=request.user, is_active=True)
                return membership.role
            except GroupMembership.DoesNotExist:
                return None
        return None
    
    def get_user_balance(self, obj):
        """Get current user's balance in the group"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            balances = obj.calculate_balances()
            return str(balances.get(request.user.id, Decimal('0')))
        return '0'
    
    def get_recent_activity(self, obj):
        """Get recent group activity"""
        activities = obj.activities.all()[:5]
        return GroupActivitySerializer(activities, many=True).data


class SimpleGroupSerializer(serializers.ModelSerializer):
    """Simple group serializer"""
    
    currency_details = CurrencySerializer(source='currency', read_only=True)
    
    class Meta:
        model = Group
        fields = [
            'id', 'name', 'group_type', 'currency', 'currency_details',
            'member_count', 'image'
        ]


class GroupCreateSerializer(serializers.ModelSerializer):
    """Group creation serializer"""
    
    class Meta:
        model = Group
        fields = [
            'name', 'description', 'group_type', 'currency',
            'is_private', 'image'
        ]
    
    def create(self, validated_data):
        user = self.context['request'].user
        group = Group.objects.create(**validated_data)
        
        # Create admin membership for creator
        GroupMembership.objects.create(
            user=user,
            group=group,
            role='admin',
            status='accepted',
            is_active=True,
            joined_at=timezone.now()
        )
        
        return group


class GroupMembershipSerializer(serializers.ModelSerializer):
    """Group membership serializer"""
    
    user = SimpleUserSerializer(read_only=True)
    group = SimpleGroupSerializer(read_only=True)
    invited_by = SimpleUserSerializer(read_only=True)
    
    class Meta:
        model = GroupMembership
        fields = [
            'id', 'user', 'group', 'role', 'status', 'invited_by',
            'invitation_message', 'is_active', 'joined_at', 'left_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'user', 'group', 'invited_by', 'joined_at',
            'left_at', 'created_at', 'updated_at'
        ]


class GroupInvitationSerializer(serializers.ModelSerializer):
    """Group invitation serializer"""
    
    group = SimpleGroupSerializer(read_only=True)
    invited_by = SimpleUserSerializer(read_only=True)
    accepted_by = SimpleUserSerializer(read_only=True)
    group_id = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = GroupInvitation
        fields = [
            'id', 'group', 'group_id', 'invited_by', 'email', 'phone_number',
            'message', 'is_accepted', 'is_expired', 'accepted_by',
            'expires_at', 'accepted_at', 'created_at'
        ]
        read_only_fields = [
            'id', 'group', 'invited_by', 'is_accepted', 'is_expired',
            'accepted_by', 'accepted_at', 'created_at'
        ]
    
    def validate_group_id(self, value):
        try:
            group = Group.objects.get(id=value)
            
            # Check if user has permission to invite
            request_user = self.context['request'].user
            membership = group.memberships.filter(
                user=request_user,
                is_active=True,
                role__in=['admin', 'member']
            ).first()
            
            if not membership:
                raise serializers.ValidationError("You don't have permission to invite to this group")
            
            return value
        except Group.DoesNotExist:
            raise serializers.ValidationError("Group not found")
    
    def validate(self, attrs):
        if not attrs.get('email') and not attrs.get('phone_number'):
            raise serializers.ValidationError("Either email or phone number is required")
        return attrs
    
    def create(self, validated_data):
        group_id = validated_data.pop('group_id')
        group = Group.objects.get(id=group_id)
        
        invitation = GroupInvitation.objects.create(
            group=group,
            invited_by=self.context['request'].user,
            expires_at=timezone.now() + timezone.timedelta(days=7),
            **validated_data
        )
        
        return invitation


class GroupActivitySerializer(serializers.ModelSerializer):
    """Group activity serializer"""
    
    user = SimpleUserSerializer(read_only=True)
    
    class Meta:
        model = GroupActivity
        fields = [
            'id', 'activity_type', 'description', 'user',
            'metadata', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class GroupBalanceSerializer(serializers.Serializer):
    """Group balance serializer"""
    
    user_id = serializers.IntegerField()
    user = SimpleUserSerializer(read_only=True)
    balance = serializers.DecimalField(max_digits=15, decimal_places=2)
    owes = serializers.DecimalField(max_digits=15, decimal_places=2, default=0)
    owed = serializers.DecimalField(max_digits=15, decimal_places=2, default=0)


class GroupStatsSerializer(serializers.Serializer):
    """Group statistics serializer"""
    
    total_expenses = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_settled = serializers.DecimalField(max_digits=15, decimal_places=2)
    pending_amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    member_count = serializers.IntegerField()
    expense_count = serializers.IntegerField()
    currency = serializers.CharField()
    
    # Monthly trends
    monthly_expenses = serializers.ListField(child=serializers.DictField())
    category_breakdown = serializers.DictField()
    top_spenders = serializers.ListField(child=serializers.DictField())
