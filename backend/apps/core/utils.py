"""
Shared utilities for the core app.
"""


def get_client_ip(request):
    """
    Extract client IP from request.
    Prefer HTTP_X_FORWARDED_FOR (when behind proxy/load balancer), fallback to REMOTE_ADDR.
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '')
