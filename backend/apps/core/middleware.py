"""
API Logging and Idempotency Middleware.
"""
import logging
import time
from django.utils.deprecation import MiddlewareMixin
from django.http import HttpResponse
from django.core.cache import cache

from .utils import get_client_ip

logger = logging.getLogger('api')

# Idempotency: cache key prefix and TTL (24h)
IDEMPOTENCY_CACHE_PREFIX = 'idempotency'
IDEMPOTENCY_TTL_SECONDS = 24 * 3600


class IdempotencyMiddleware(MiddlewareMixin):
    """
    For POST /api/expenses/, honor Idempotency-Key header to prevent double-submissions.
    When the same key is sent again within TTL, returns the cached response without running the view.
    """
    def process_request(self, request):
        if request.method != 'POST':
            return None
        path = request.path.rstrip('/')
        if path != '/api/expenses':
            return None
        key = request.headers.get('Idempotency-Key') or request.META.get('HTTP_IDEMPOTENCY_KEY')
        if not key or not key.strip():
            return None
        key = key.strip()
        if not getattr(request, 'user', None) or not request.user.is_authenticated:
            return None
        cache_key = f'{IDEMPOTENCY_CACHE_PREFIX}:{request.user.id}:{key}'
        cached = cache.get(cache_key)
        if cached is not None:
            status_code, content, content_type = cached
            return HttpResponse(content=content, status=status_code, content_type=content_type)
        request._idempotency_key = key
        request._idempotency_cache_key = cache_key
        return None

    def process_response(self, request, response):
        cache_key = getattr(request, '_idempotency_cache_key', None)
        if not cache_key:
            return response
        if 200 <= response.status_code < 300 and hasattr(response, 'content'):
            content_type = response.get('Content-Type', 'application/json')
            cache.set(
                cache_key,
                (response.status_code, response.content, content_type),
                timeout=IDEMPOTENCY_TTL_SECONDS,
            )
        return response


class APILoggingMiddleware(MiddlewareMixin):
    """Log all API requests and responses; IP from X-Forwarded-For when present."""

    def process_request(self, request):
        request.start_time = time.time()
        if request.path.startswith('/api/'):
            logger.info(
                f"API Request: {request.method} {request.path}",
                extra={
                    'method': request.method,
                    'path': request.path,
                    'user': str(request.user) if hasattr(request, 'user') and request.user.is_authenticated else 'Anonymous',
                    'ip': get_client_ip(request),
                }
            )

    def process_response(self, request, response):
        if request.path.startswith('/api/'):
            duration = time.time() - getattr(request, 'start_time', 0)
            logger.info(
                f"API Response: {request.method} {request.path} - {response.status_code}",
                extra={
                    'method': request.method,
                    'path': request.path,
                    'status_code': response.status_code,
                    'duration': duration,
                    'user': str(request.user) if hasattr(request, 'user') and request.user.is_authenticated else 'Anonymous',
                    'ip': get_client_ip(request),
                }
            )
        return response
