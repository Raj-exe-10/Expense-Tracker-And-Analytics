import base64
import hashlib
import secrets
from django.contrib.auth.hashers import make_password, check_password
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status


def _get_profile(user):
    from .models import UserProfile
    profile, _ = UserProfile.objects.get_or_create(user=user)
    return profile


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def security_settings(request):
    profile = _get_profile(request.user)
    if request.method == 'GET':
        return Response({
            'hide_balances': profile.hide_balances,
            'contacts_sync_enabled': profile.contacts_sync_enabled,
            'biometric_lock_enabled': profile.biometric_lock_enabled,
            'totp_enabled': profile.totp_enabled,
            'has_app_lock_pin': bool(profile.app_lock_pin_hash),
        })
    data = request.data
    for field in ('hide_balances', 'contacts_sync_enabled', 'biometric_lock_enabled'):
        if field in data:
            setattr(profile, field, bool(data[field]))
    profile.save()
    return Response({'success': True})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def totp_setup(request):
    profile = _get_profile(request.user)
    secret = profile.totp_secret or base64.b32encode(secrets.token_bytes(20)).decode('utf-8')
    profile.totp_secret = secret
    profile.save(update_fields=['totp_secret'])
    issuer = 'LedgerCore'
    uri = f'otpauth://totp/{issuer}:{request.user.email}?secret={secret}&issuer={issuer}'
    return Response({'secret': secret, 'provisioning_uri': uri})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def totp_verify(request):
    code = request.data.get('code', '')
    profile = _get_profile(request.user)
    if not profile.totp_secret:
        return Response({'detail': 'Setup TOTP first'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        import pyotp
        totp = pyotp.TOTP(profile.totp_secret)
        if totp.verify(code, valid_window=1):
            profile.totp_enabled = True
            profile.save(update_fields=['totp_enabled'])
            return Response({'success': True})
    except ImportError:
        return Response(
            {'detail': 'TOTP library not available'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    return Response({'detail': 'Invalid code'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def set_app_lock_pin(request):
    pin = request.data.get('pin', '')
    if len(pin) < 4:
        return Response({'detail': 'PIN too short'}, status=status.HTTP_400_BAD_REQUEST)
    profile = _get_profile(request.user)
    profile.app_lock_pin_hash = make_password(pin)
    profile.biometric_lock_enabled = request.data.get('use_biometric', False)
    profile.save(update_fields=['app_lock_pin_hash', 'biometric_lock_enabled'])
    return Response({'success': True})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_app_lock_pin(request):
    """Verify app-lock PIN for the authenticated user only.

    Uses profile-local failed attempt counters so PIN failures do not lock
    password login (which uses User.failed_login_attempts).
    """
    pin = request.data.get('pin', '')
    user = request.user
    profile = _get_profile(user)

    from django.utils import timezone
    from datetime import timedelta

    # Store lockout on user prefs JSON so PIN failures do not lock password login.
    lock_meta = getattr(user, 'user_notification_preferences', None) or {}
    if not isinstance(lock_meta, dict):
        lock_meta = {}
    pin_lock = lock_meta.get('app_lock_pin') or {}
    locked_until = pin_lock.get('locked_until')
    if locked_until:
        try:
            from django.utils.dateparse import parse_datetime
            until = parse_datetime(locked_until)
            if until and until > timezone.now():
                return Response(
                    {'detail': 'Too many attempts. Try again later.'},
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )
        except (TypeError, ValueError):
            pass

    if profile.app_lock_pin_hash and check_password(pin, profile.app_lock_pin_hash):
        lock_meta['app_lock_pin'] = {'failed': 0, 'locked_until': None}
        user.user_notification_preferences = lock_meta
        user.save(update_fields=['user_notification_preferences'])
        return Response({'success': True})

    failed = int(pin_lock.get('failed') or 0) + 1
    new_meta = {'failed': failed, 'locked_until': None}
    if failed >= 5:
        new_meta = {
            'failed': 0,
            'locked_until': (timezone.now() + timedelta(minutes=15)).isoformat(),
        }
    lock_meta['app_lock_pin'] = new_meta
    user.user_notification_preferences = lock_meta
    user.save(update_fields=['user_notification_preferences'])
    return Response({'detail': 'Invalid PIN'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def delete_account(request):
    user = request.user
    user.is_active = False
    user.save(update_fields=['is_active'])
    return Response({'success': True})
