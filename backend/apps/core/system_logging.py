"""Persist structured logs for admin monitoring + mirror to console."""
from __future__ import annotations

import logging
from typing import Any, Optional

from django.conf import settings

logger = logging.getLogger('apps.core.system_logging')
console_trace = logging.getLogger('ledgercore.trace')

# Throttle duplicate console lines only (DB always records).
CONSOLE_THROTTLE_SECONDS = 3
THROTTLED_CONSOLE_PATHS = frozenset({
    '/api/dashboard/home/',
    '/api/auth/me/',
    '/api/payments/payment-requests/pending_for_me/',
})


def _truncate(text: str, max_len: int = 500) -> str:
    return text[:max_len] if len(text) > max_len else text


def _should_throttle_console(user_id: Optional[int], path: str, method: str) -> bool:
    if method != 'GET' or path not in THROTTLED_CONSOLE_PATHS:
        return False
    try:
        from django.core.cache import cache
        key = f'syslog:console:{user_id or "anon"}:{path}'
        if cache.get(key):
            return True
        cache.set(key, 1, CONSOLE_THROTTLE_SECONDS)
    except Exception:
        pass
    return False


def _mirror_console(
    *,
    level: str,
    category: str,
    message: str,
    request_method: str = '',
    request_path: str = '',
    status_code: Optional[int] = None,
    duration_ms: Optional[int] = None,
) -> None:
    """Print to terminal so devs can tail backend activity alongside the admin UI."""
    if not getattr(settings, 'LOG_TO_CONSOLE', True):
        return
    # ASCII-only for Windows cp1252 consoles (no Unicode arrows)
    if request_method and request_path:
        line = f'[{category}] {request_method} {request_path}'
        if status_code is not None:
            line += f' -> {status_code}'
        if duration_ms is not None:
            line += f' ({duration_ms}ms)'
    else:
        line = f'[{category}] {message}'
    if level in ('error', 'critical'):
        console_trace.error(line)
    elif level == 'warning':
        console_trace.warning(line)
    else:
        console_trace.info(line)


def record_system_log(
    *,
    message: str,
    level: str = 'info',
    category: str = 'system',
    user=None,
    request_method: str = '',
    request_path: str = '',
    status_code: Optional[int] = None,
    duration_ms: Optional[int] = None,
    ip_address: Optional[str] = None,
    user_agent: str = '',
    metadata: Optional[dict[str, Any]] = None,
    skip_console: bool = False,
) -> Optional[int]:
    from .models import SystemLog

    if not skip_console:
        _mirror_console(
            level=level,
            category=category,
            message=message,
            request_method=request_method,
            request_path=request_path,
            status_code=status_code,
            duration_ms=duration_ms,
        )

    try:
        entry = SystemLog.objects.create(
            level=level,
            category=category,
            message=_truncate(message),
            user=user if getattr(user, 'is_authenticated', False) else None,
            request_method=request_method[:10],
            request_path=request_path[:255],
            status_code=status_code,
            duration_ms=duration_ms,
            ip_address=ip_address,
            user_agent=(user_agent or '')[:2000],
            metadata=metadata or {},
        )
        return entry.id
    except Exception:
        logger.exception('Failed to write SystemLog')
        return None


def record_http_request(
    *,
    request,
    response,
    duration_ms: int,
) -> None:
    path = request.path
    if not path.startswith('/api/'):
        return
    if request.method == 'OPTIONS':
        return
    # Avoid recursion when admin loads the log viewer
    if '/api/core/system-logs' in path:
        return

    user = request.user if getattr(request, 'user', None) and request.user.is_authenticated else None
    user_id = user.id if user else None

    status = response.status_code
    if status >= 500:
        level = 'error'
    elif status >= 400:
        level = 'warning'
    else:
        level = 'info'

    ip = _client_ip(request)
    skip_console = _should_throttle_console(user_id, path, request.method)

    record_system_log(
        message=f'{request.method} {path} -> {status} ({duration_ms}ms)',
        level=level,
        category='http',
        user=user,
        request_method=request.method,
        request_path=path,
        status_code=status,
        duration_ms=duration_ms,
        ip_address=ip,
        user_agent=request.META.get('HTTP_USER_AGENT', ''),
        metadata={'query': dict(request.GET.items()) if request.GET else {}},
        skip_console=skip_console,
    )


def record_user_activity(
    *,
    user,
    action: str,
    object_repr: str = '',
    content_type: str = '',
    object_id: str = '',
    changes: Optional[dict] = None,
    ip_address: Optional[str] = None,
    user_agent: str = '',
) -> None:
    from .models import ActivityLog

    activity = ActivityLog.objects.create(
        user=user,
        action=action,
        content_type=content_type,
        object_id=str(object_id) if object_id else '',
        object_repr=object_repr[:200],
        changes=changes or {},
        ip_address=ip_address,
        user_agent=user_agent,
    )
    record_system_log(
        message=object_repr or f'{action} activity',
        level='info',
        category='user_activity',
        user=user,
        ip_address=ip_address,
        user_agent=user_agent,
        metadata={
            'activity_id': activity.pk,
            'action': action,
            'content_type': content_type,
            'object_id': object_id,
        },
    )


def _client_ip(request) -> Optional[str]:
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')
