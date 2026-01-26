from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import authenticate
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from .models import User, UserProfile, UserFriendship, EmailVerification


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT token serializer with additional user data - accepts email instead of username"""
    
    username_field = 'email'  # Use email instead of username for authentication
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Add email field while keeping username for parent validation
        # The parent TokenObtainPairSerializer expects 'username' field
        # We'll map email to username in to_internal_value
        if 'username' in self.fields:
            # Keep username field but make it optional/hidden
            self.fields['username'].required = False
            self.fields['username'].allow_blank = True
            # Add email field
            from rest_framework import serializers as drf_serializers
            self.fields['email'] = drf_serializers.EmailField(required=True, label='Email')
    
    def to_internal_value(self, data):
        # Map 'email' to 'username' for parent class validation
        # The parent TokenObtainPairSerializer expects 'username' field
        if isinstance(data, dict):
            data = data.copy()
            if 'email' in data and 'username' not in data:
                data['username'] = data['email']
        return super().to_internal_value(data)
    
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
        # Get email from attrs (either from 'email' field or 'username' if mapped)
        email = attrs.get('email') or attrs.get('username', '')
        password = attrs.get('password', '')
        
        if not email or not password:
            # Return a non-field error (as a list) to avoid field-specific error formatting
            raise serializers.ValidationError(
                ['Email and password are required.'],
                code='required'
            )
        
        # Since USERNAME_FIELD is 'email', authenticate with email as username
        User = get_user_model()
        user = None
        
        try:
            # Get user by email first
            user_obj = User.objects.get(email=email)
            
            # Authenticate - Django's authenticate uses USERNAME_FIELD which is 'email'
            # So we pass email as the username parameter
            user = authenticate(
                request=self.context.get('request'),
                username=email,  # This works because USERNAME_FIELD is 'email'
                password=password
            )
            
            # If authenticate returns None, check password manually
            if user is None:
                if user_obj.check_password(password):
                    if not user_obj.is_active:
                        raise serializers.ValidationError(
                            ['User account is disabled. Please contact support.'],
                            code='account_disabled'
                        )
                    user = user_obj
                else:
                    raise serializers.ValidationError(
                        ['Invalid email or password. Please check your credentials and try again.'],
                        code='invalid_credentials'
                    )
        except User.DoesNotExist:
            raise serializers.ValidationError(
                ['No account found with this email address. Please check your email or sign up.'],
                code='user_not_found'
            )
        except serializers.ValidationError:
            raise  # Re-raise validation errors
        except Exception as e:
            raise serializers.ValidationError(
                ['Authentication failed. Please try again. If the problem persists, contact support.'],
                code='authentication_error'
            )
        
        if user is None:
            raise serializers.ValidationError(
                ['Invalid email or password. Please check your credentials and try again.'],
                code='invalid_credentials'
            )
        
        if not user.is_active:
            raise serializers.ValidationError(
                ['User account is disabled. Please contact support.'],
                code='account_disabled'
            )
        
        # Get token
        refresh = self.get_token(user)
        
        data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
        
        # Add user data to response
        data['user'] = {
            'id': user.id,
            'email': user.email,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'full_name': user.get_full_name(),
            'role': user.role,
            'is_verified': user.is_verified,
            'is_premium': user.is_premium,
            'preferred_currency': user.preferred_currency or 'USD',
            'timezone': user.timezone or 'UTC',
            'avatar': user.avatar.url if hasattr(user, 'avatar') and user.avatar else None,
        }
        
        self.user = user
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
        if value and User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value.lower() if value else value
    
    def validate_username(self, value):
        if value and User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("This username is already taken. Please choose a different username.")
        return value.lower() if value else value
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        # Create user with password (create_user handles password hashing)
        user = User.objects.create_user(
            password=password,
            **validated_data
        )
        
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
