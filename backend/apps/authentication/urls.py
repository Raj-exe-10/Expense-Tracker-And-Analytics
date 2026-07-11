from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenVerifyView
from . import views
from . import security_views

router = DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'profiles', views.UserProfileViewSet)
router.register(r'friendships', views.UserFriendshipViewSet)

urlpatterns = [
    # JWT Token endpoints
    path('token/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', views.ThrottledTokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    
    # Authentication endpoints
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.CustomTokenObtainPairView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('me/', views.UserProfileView.as_view(), name='user_profile'),
    
    # Password management
    path('password/change/', views.ChangePasswordView.as_view(), name='change_password'),
    path('password/reset/', views.RequestPasswordResetView.as_view(), name='password_reset'),
    path('password/reset/confirm/', views.PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    
    # Email verification
    path('verify-email/', views.SendEmailVerificationView.as_view(), name='send_email_verification'),
    path('verify-email/confirm/<str:token>/', views.ConfirmEmailVerificationView.as_view(), name='confirm_email_verification'),

    path('security/', security_views.security_settings, name='security_settings'),
    path('security/totp/setup/', security_views.totp_setup, name='totp_setup'),
    path('security/totp/verify/', security_views.totp_verify, name='totp_verify'),
    path('security/app-lock/', security_views.set_app_lock_pin, name='set_app_lock_pin'),
    path('security/app-lock/verify/', security_views.verify_app_lock_pin, name='verify_app_lock_pin'),
    path('security/delete-account/', security_views.delete_account, name='delete_account'),
    
    # Router URLs
    path('', include(router.urls)),
]
