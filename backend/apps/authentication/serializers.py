from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import authenticate
from django.core.exceptions import ValidationError
from .models import User, UserProfile, UserFriendship, EmailVerification


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT token serializer with additional user data"""
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Add custom claims
        token['user_id'] = str(user.id)
        token['email'] = user.email
        token['full_name'] = user.get_full_name()
        token['role'] = user.role
        token['is_verified'] = user.is_verified
        token['is_premium'] = user.is_premium
        
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Add user data to response
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'username': self.user.username,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
            'role': self.user.role,
            'is_verified': self.user.is_verified,
            'is_premium': self.user.is_premium,
            'preferred_currency': self.user.preferred_currency,
            'timezone': self.user.timezone,
            'avatar': self.user.avatar.url if self.user.avatar else None,
        }
        
        return data


class UserRegistrationSerializer(serializers.ModelSerializer):
    """User registration serializer"""
    
    password = serializers.CharField(
        write_only=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'first_name', 'last_name',
            'password', 'password_confirm', 'phone_number',
            'preferred_currency', 'timezone'
        ]
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
        }
    
    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password_confirm'):
            raise serializers.ValidationError("Passwords don't match.")
        return attrs
    
    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("User with this email already exists.")
        return value.lower()
    
    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("Username already taken.")
        return value.lower()
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        
        # Create user profile
        UserProfile.objects.create(user=user)
        
        return user


class UserSerializer(serializers.ModelSerializer):
    """User serializer for API responses"""
    
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    profile = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'phone_number', 'avatar', 'bio',
            'date_of_birth', 'preferred_currency', 'timezone',
            'role', 'is_verified', 'is_premium', 'profile_visibility',
            'date_joined', 'last_login', 'profile'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login', 'full_name']
    
    def get_profile(self, obj):
        try:
            profile = obj.profile
            return {
                'occupation': profile.occupation,
                'company': profile.company,
                'website': profile.website,
                'country': profile.country,
                'city': profile.city,
                'total_expenses': str(profile.total_expenses),
                'total_groups': profile.total_groups,
                'expense_count': profile.expense_count,
            }
        except UserProfile.DoesNotExist:
            return None


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user information"""
    
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'phone_number', 'avatar',
            'bio', 'date_of_birth', 'preferred_currency', 'timezone',
            'profile_visibility'
        ]
    
    def validate_phone_number(self, value):
        if value and User.objects.filter(phone_number=value).exclude(id=self.instance.id).exists():
            raise serializers.ValidationError("Phone number already in use.")
        return value


class UserProfileSerializer(serializers.ModelSerializer):
    """User profile serializer"""
    
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = UserProfile
        fields = '__all__'
        read_only_fields = ['user', 'total_expenses', 'total_groups', 'expense_count']


class ChangePasswordSerializer(serializers.Serializer):
    """Password change serializer"""
    
    current_password = serializers.CharField(
        style={'input_type': 'password'}
    )
    new_password = serializers.CharField(
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    new_password_confirm = serializers.CharField(
        style={'input_type': 'password'}
    )
    
    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("New passwords don't match.")
        return attrs


class PasswordResetSerializer(serializers.Serializer):
    """Password reset request serializer"""
    
    email = serializers.EmailField()
    
    def validate_email(self, value):
        if not User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("No user found with this email address.")
        return value.lower()


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Password reset confirmation serializer"""
    
    token = serializers.CharField()
    new_password = serializers.CharField(
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    new_password_confirm = serializers.CharField(
        style={'input_type': 'password'}
    )
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("Passwords don't match.")
        return attrs


class EmailVerificationSerializer(serializers.Serializer):
    """Email verification serializer"""
    
    email = serializers.EmailField(required=False)
    
    def validate_email(self, value):
        if value and User.objects.filter(email__iexact=value).exclude(
            id=self.context['request'].user.id
        ).exists():
            raise serializers.ValidationError("Email already in use by another user.")
        return value.lower() if value else None


class UserFriendshipSerializer(serializers.ModelSerializer):
    """User friendship serializer"""
    
    from_user = UserSerializer(read_only=True)
    to_user = UserSerializer(read_only=True)
    to_user_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = UserFriendship
        fields = [
            'id', 'from_user', 'to_user', 'to_user_id',
            'status', 'message', 'created_at'
        ]
        read_only_fields = ['id', 'from_user', 'to_user', 'created_at']
    
    def validate_to_user_id(self, value):
        try:
            user = User.objects.get(id=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found.")
        
        request_user = self.context['request'].user
        
        if user == request_user:
            raise serializers.ValidationError("Cannot send friend request to yourself.")
        
        # Check if friendship already exists
        if UserFriendship.objects.filter(
            from_user=request_user,
            to_user=user
        ).exists():
            raise serializers.ValidationError("Friend request already sent.")
        
        if UserFriendship.objects.filter(
            from_user=user,
            to_user=request_user
        ).exists():
            raise serializers.ValidationError("This user already sent you a friend request.")
        
        return value
    
    def create(self, validated_data):
        to_user_id = validated_data.pop('to_user_id')
        to_user = User.objects.get(id=to_user_id)
        
        friendship = UserFriendship.objects.create(
            from_user=self.context['request'].user,
            to_user=to_user,
            **validated_data
        )
        
        return friendship


class SimpleUserSerializer(serializers.ModelSerializer):
    """Simple user serializer for minimal data"""
    
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name', 'avatar']
        read_only_fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name', 'avatar']
