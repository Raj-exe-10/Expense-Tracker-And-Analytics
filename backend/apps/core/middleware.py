"""
API request logging: database (admin UI) + console trace (dev monitoring).
"""
import logging
import time

from django.utils.deprecation import MiddlewareMixin

from .system_logging import record_http_request

logger = logging.getLogger('api')


class APILoggingMiddleware(MiddlewareMixin):
    """Record API traffic to SystemLog and console."""

    def process_request(self, request):
        request._api_start_time = time.perf_counter()

    def process_response(self, request, response):
        if not request.path.startswith('/api/'):
            return response
        if request.method == 'OPTIONS':
            return response

        start = getattr(request, '_api_start_time', None)
        duration_ms = int((time.perf_counter() - start) * 1000) if start else 0

        try:
            record_http_request(request=request, response=response, duration_ms=duration_ms)
        except Exception:
            logger.exception('SystemLog middleware failed')

        return response
