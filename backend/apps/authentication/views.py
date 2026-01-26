from rest_framework import generics, status, viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.throttling import AnonRateThrottle
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils import timezone
from django.db.models import Q
from drf_spectacular.utils import extend_schema
import secrets
import uuid
from datetime import timedelta

from .models import User, UserProfile, UserFriendship, EmailVerification
from .serializers import (
    CustomTokenObtainPairSerializer, UserRegistrationSerializer,
    UserSerializer, UserUpdateSerializer, UserProfileSerializer,
    ChangePasswordSerializer, PasswordResetSerializer,
    PasswordResetConfirmSerializer, EmailVerificationSerializer,
    UserFriendshipSerializer, SimpleUserSerializer
)
from apps.core.models import ActivityLog


class LoginRateThrottle(AnonRateThrottle):
    """Rate limiting for login endpoint - 5 attempts per minute"""
    rate = '5/minute'


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom JWT token view with enhanced user data"""
    serializer_class = CustomTokenObtainPairSerializer
    throttle_classes = [LoginRateThrottle]
    
    def post(self, request, *args, **kwargs):
        # Check for account lockout before attempting login
        email = request.data.get('email') or request.data.get('username')
        if email:
            try:
                user = User.objects.get(email=email)
                if user.account_locked_until and user.account_locked_until > timezone.now():
                    return Response(
                        {'detail': f'Account locked until {user.account_locked_until}. Please try again later.'},
                        status=status.HTTP_423_LOCKED
                    )
            except User.DoesNotExist:
                pass
        
        try:
            # Call parent's post method which handles serialization
            response = super().post(request, *args, **kwargs)
            
            if response.status_code == 200:
                # Log successful login
                try:
                    email = request.data.get('email') or request.data.get('username')
                    if email:
                        user = User.objects.get(email=email)
                        ActivityLog.objects.create(
                            user=user,
                            action='login',
                            object_repr=f"Login from {request.META.get('REMOTE_ADDR')}",
                            ip_address=request.META.get('REMOTE_ADDR'),
                            user_agent=request.META.get('HTTP_USER_AGENT', '')
                        )
                        
                        # Update last login IP and reset failed attempts
                        user.last_login_ip = request.META.get('REMOTE_ADDR')
                        user.failed_login_attempts = 0
                        user.account_locked_until = None
                        user.save(update_fields=['last_login_ip', 'failed_login_attempts', 'account_locked_until'])
                except User.DoesNotExist:
                    pass
            else:
                # Increment failed attempts on failed login
                email = request.data.get('email') or request.data.get('username')
                if email:
                    try:
                        user = User.objects.get(email=email)
                        user.failed_login_attempts += 1
                        
                        # Lock account after 5 failed attempts for 15 minutes
                        if user.failed_login_attempts >= 5:
                            user.account_locked_until = timezone.now() + timedelta(minutes=15)
                        
                        user.save(update_fields=['failed_login_attempts', 'account_locked_until'])
                    except User.DoesNotExist:
                        pass
            
            return response
        except Exception as e:
            # Return proper error response with detail field
            from rest_framework import status
            from rest_framework.response import Response
            from rest_framework.serializers import ValidationError as SerializerValidationError
            import traceback
            
            # Log the error for debugging
            import traceback
            print(f"Login error: {type(e).__name__}: {str(e)}")
            if hasattr(e, 'detail'):
                print(f"Error detail: {e.detail}")
            print(f"Traceback: {traceback.format_exc()}")
            
            # Extract error message from exception
            error_message = 'Invalid email or password. Please check your credentials and try again.'
            
            if isinstance(e, SerializerValidationError):
                error_detail = e.detail
                if isinstance(error_detail, list):
                    error_message = '; '.join(str(msg) for msg in error_detail)
                elif isinstance(error_detail, dict):
                    # Handle field errors - filter out 'username' errors since we use 'email'
                    error_messages = []
                    for field, errors in error_detail.items():
                        # Skip 'username' field errors as we use email for authentication
                        if field == 'username':
                            continue
                        if isinstance(errors, list):
                            error_messages.extend([str(err) for err in errors])
                        else:
                            error_messages.append(str(errors))
                    # If no other errors, provide a generic message
                    error_message = '; '.join(error_messages) if error_messages else error_message
                else:
                    error_message = str(error_detail)
            elif hasattr(e, 'detail'):
                if isinstance(e.detail, list):
                    error_message = '; '.join(str(msg) for msg in e.detail)
                elif isinstance(e.detail, dict):
                    error_messages = []
                    for field, errors in e.detail.items():
                        if field == 'username':
                            continue
                        if isinstance(errors, list):
                            error_messages.extend([str(err) for err in errors])
                        else:
                            error_messages.append(str(errors))
                    error_message = '; '.join(error_messages) if error_messages else error_message
                else:
                    error_message = str(e.detail)
            else:
                error_message = str(e) if str(e) else error_message
            
            return Response(
                {'detail': error_message, 'message': error_message},
                status=status.HTTP_400_BAD_REQUEST
            )


class RegisterView(generics.CreateAPIView):
    """User registration endpoint"""
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    
    @extend_schema(
        summary="Register a new user",
        description="Create a new user account with email verification",
    )
    def post(self, request, *args, **kwargs):
        try:
            response = super().post(request, *args, **kwargs)
            
            if response.status_code == 201:
                user = User.objects.get(email=response.data['email'])
                
                # Send welcome email verification
                self.send_verification_email(user)
                
                # Log registration
                ActivityLog.objects.create(
                    user=user,
                    action='create',
                    object_repr=f"User registration: {user.email}",
                    ip_address=request.META.get('REMOTE_ADDR'),
                    user_agent=request.META.get('HTTP_USER_AGENT', '')
                )
                
                response.data['message'] = 'Registration successful! You can now login with your credentials.'
            
            return response
        except Exception as e:
            from rest_framework import status
            from rest_framework.response import Response
            from rest_framework.serializers import ValidationError as SerializerValidationError
            
            # Handle serializer validation errors
            if isinstance(e, SerializerValidationError):
                error_detail = e.detail
                if isinstance(error_detail, dict):
                    # Extract meaningful error messages, prioritizing email over username
                    error_messages = []
                    if 'email' in error_detail:
                        if isinstance(error_detail['email'], list):
                            error_messages.extend(error_detail['email'])
                        else:
                            error_messages.append(str(error_detail['email']))
                    if 'username' in error_detail and 'email' not in error_detail:
                        # Only show username error if email error is not present
                        if isinstance(error_detail['username'], list):
                            error_messages.extend(error_detail['username'])
                        else:
                            error_messages.append(str(error_detail['username']))
                    # Add other field errors
                    for field, errors in error_detail.items():
                        if field not in ['email', 'username']:
                            if isinstance(errors, list):
                                error_messages.extend([str(err) for err in errors])
                            else:
                                error_messages.append(str(errors))
                    
                    error_message = '; '.join(error_messages) if error_messages else 'Registration failed. Please check your information.'
                elif isinstance(error_detail, list):
                    error_message = '; '.join(str(msg) for msg in error_detail)
                else:
                    error_message = str(error_detail)
            else:
                # Handle other exceptions
                error_message = str(e)
                if 'email' in error_message.lower() and 'already exists' in error_message.lower():
                    error_message = 'An account with this email already exists.'
                elif 'username' in error_message.lower() and 'already' in error_message.lower():
                    error_message = 'This username is already taken. Please choose a different username.'
            
            return Response(
                {'detail': error_message, 'message': error_message},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def send_verification_email(self, user):
        """Send email verification"""
        token = secrets.token_urlsafe(32)
        expires_at = timezone.now() + timedelta(hours=24)
        
        EmailVerification.objects.create(
            user=user,
            token=token,
            email=user.email,
            expires_at=expires_at
        )
        
        verification_url = f"{settings.FRONTEND_URL}/verify-email/{token}"
        
        subject = "Verify your email - Expense Tracker"
        message = render_to_string('emails/email_verification.html', {
            'user': user,
            'verification_url': verification_url,
            'verification_link': verification_url,
            'verification_code': token[:8]  # First 8 characters for display
        })
        
        # Send email (implement based on your email backend)
        # send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email])


class LogoutView(APIView):
    """Logout endpoint that blacklists refresh token"""
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        summary="Logout user",
        description="Logout user and blacklist refresh token",
    )
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            # Log logout
            ActivityLog.objects.create(
                user=request.user,
                action='logout',
                object_repr=f"Logout from {request.META.get('REMOTE_ADDR')}",
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            return Response({'message': 'Successfully logged out'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """Current user profile endpoint"""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    
    def get_serializer_class(self):
        if self.request.method == 'PATCH' or self.request.method == 'PUT':
            return UserUpdateSerializer
        return UserSerializer


class ChangePasswordView(APIView):
    """Change password endpoint"""
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        request=ChangePasswordSerializer,
        summary="Change user password",
    )
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            
            # Log password change
            ActivityLog.objects.create(
                user=user,
                action='update',
                object_repr="Password changed",
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            return Response({'message': 'Password changed successfully'}, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RequestPasswordResetView(APIView):
    """Request password reset endpoint"""
    permission_classes = [permissions.AllowAny]
    
    @extend_schema(
        request=PasswordResetSerializer,
        summary="Request password reset",
    )
    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        
        if serializer.is_valid():
            email = serializer.validated_data['email']
            try:
                user = User.objects.get(email=email)
                
                # Generate reset token
                token = default_token_generator.make_token(user)
                uid = urlsafe_base64_encode(force_bytes(user.pk))
                
                reset_url = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}"
                
                subject = "Password Reset - Expense Tracker"
                message = render_to_string('emails/password_reset.html', {
                    'user': user,
                    'reset_url': reset_url
                })
                
                # Send email
                # send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email])
                
                return Response({'message': 'Password reset email sent'}, status=status.HTTP_200_OK)
            
            except User.DoesNotExist:
                pass  # Don't reveal if email exists
        
        return Response({'message': 'If the email exists, a reset link has been sent'}, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    """Password reset confirmation endpoint"""
    permission_classes = [permissions.AllowAny]
    
    @extend_schema(
        request=PasswordResetConfirmSerializer,
        summary="Confirm password reset",
    )
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                uid = request.data.get('uid')
                token = serializer.validated_data['token']
                
                user_id = force_str(urlsafe_base64_decode(uid))
                user = User.objects.get(pk=user_id)
                
                if default_token_generator.check_token(user, token):
                    user.set_password(serializer.validated_data['new_password'])
                    user.save()
                    
                    # Log password reset
                    ActivityLog.objects.create(
                        user=user,
                        action='update',
                        object_repr="Password reset completed",
                        ip_address=request.META.get('REMOTE_ADDR'),
                        user_agent=request.META.get('HTTP_USER_AGENT', '')
                    )
                    
                    return Response({'message': 'Password reset successful'}, status=status.HTTP_200_OK)
                else:
                    return Response({'error': 'Invalid or expired token'}, status=status.HTTP_400_BAD_REQUEST)
            
            except (ValueError, User.DoesNotExist):
                return Response({'error': 'Invalid reset link'}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SendEmailVerificationView(APIView):
    """Send email verification endpoint"""
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        request=EmailVerificationSerializer,
        summary="Send email verification",
    )
    def post(self, request):
        serializer = EmailVerificationSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            user = request.user
            email = serializer.validated_data.get('email', user.email)
            
            token = secrets.token_urlsafe(32)
            expires_at = timezone.now() + timedelta(hours=24)
            
            EmailVerification.objects.create(
                user=user,
                token=token,
                email=email,
                expires_at=expires_at
            )
            
            verification_url = f"{settings.FRONTEND_URL}/verify-email/{token}"
            
            subject = "Email Verification - Expense Tracker"
            message = render_to_string('emails/email_verification.html', {
                'user': user,
                'verification_url': verification_url,
                'email': email
            })
            
            # Send email
            # send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email])
            
            return Response({'message': 'Verification email sent'}, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ConfirmEmailVerificationView(APIView):
    """Confirm email verification endpoint"""
    permission_classes = [permissions.AllowAny]
    
    @extend_schema(
        summary="Confirm email verification",
    )
    def post(self, request, token):
        try:
            verification = EmailVerification.objects.get(
                token=token,
                is_used=False
            )
            
            if verification.is_expired():
                return Response({'error': 'Verification token has expired'}, status=status.HTTP_400_BAD_REQUEST)
            
            user = verification.user
            
            # Update email if it's different
            if verification.email != user.email:
                user.email = verification.email
            
            user.is_verified = True
            user.save()
            
            verification.is_used = True
            verification.save()
            
            return Response({'message': 'Email verified successfully'}, status=status.HTTP_200_OK)
        
        except EmailVerification.DoesNotExist:
            return Response({'error': 'Invalid verification token'}, status=status.HTTP_400_BAD_REQUEST)


class UserViewSet(viewsets.ModelViewSet):
    """User management viewset"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = User.objects.all()
        
        # Search functionality
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search)
            )
        
        return queryset.exclude(id=self.request.user.id)
    
    def get_serializer_class(self):
        if self.action == 'list':
            return SimpleUserSerializer
        return UserSerializer
    
    @action(detail=False, methods=['get'])
    def friends(self, request):
        """Get user's friends"""
        friendships = UserFriendship.objects.filter(
            Q(from_user=request.user, status='accepted') |
            Q(to_user=request.user, status='accepted')
        )
        
        friends = []
        for friendship in friendships:
            friend = friendship.to_user if friendship.from_user == request.user else friendship.from_user
            friends.append(SimpleUserSerializer(friend).data)
        
        return Response(friends)
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search users"""
        query = request.query_params.get('q', '')
        if not query:
            return Response([])
        
        users = User.objects.filter(
            Q(username__icontains=query) |
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query) |
            Q(email__icontains=query)
        ).exclude(id=request.user.id)[:10]
        
        serializer = SimpleUserSerializer(users, many=True)
        return Response(serializer.data)


class UserProfileViewSet(viewsets.ModelViewSet):
    """User profile management viewset"""
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return UserProfile.objects.filter(user=self.request.user)


class UserFriendshipViewSet(viewsets.ModelViewSet):
    """User friendship management viewset"""
    queryset = UserFriendship.objects.all()
    serializer_class = UserFriendshipSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return UserFriendship.objects.filter(
            Q(from_user=self.request.user) | Q(to_user=self.request.user)
        )
    
    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """Accept friend request"""
        try:
            friendship = self.get_object()
            
            if friendship.to_user != request.user:
                return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
            
            if friendship.status != 'pending':
                return Response({'error': 'Request is not pending'}, status=status.HTTP_400_BAD_REQUEST)
            
            friendship.status = 'accepted'
            friendship.save()
            
            return Response({'message': 'Friend request accepted'}, status=status.HTTP_200_OK)
        
        except UserFriendship.DoesNotExist:
            return Response({'error': 'Friend request not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def decline(self, request, pk=None):
        """Decline friend request"""
        try:
            friendship = self.get_object()
            
            if friendship.to_user != request.user:
                return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
            
            friendship.status = 'declined'
            friendship.save()
            
            return Response({'message': 'Friend request declined'}, status=status.HTTP_200_OK)
        
        except UserFriendship.DoesNotExist:
            return Response({'error': 'Friend request not found'}, status=status.HTTP_404_NOT_FOUND)
