"""
URL configuration for config project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.auth.decorators import user_passes_test
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)


def _is_staff_or_debug(user):
    if settings.DEBUG:
        return True
    return bool(user and user.is_authenticated and user.is_staff)


_staff_docs = user_passes_test(_is_staff_or_debug)

urlpatterns = [
    path('admin/', admin.site.urls),

    # API Documentation (staff-only in production; open in DEBUG)
    path('api/schema/', _staff_docs(SpectacularAPIView.as_view()), name='schema'),
    path('api/docs/', _staff_docs(SpectacularSwaggerView.as_view(url_name='schema')), name='swagger-ui'),
    path('api/redoc/', _staff_docs(SpectacularRedocView.as_view(url_name='schema')), name='redoc'),

    # Consolidated dashboard (single round-trip)
    path('api/dashboard/', include('apps.core.dashboard_urls')),

    # API Endpoints
    path('api/auth/', include('apps.authentication.urls')),
    path('api/expenses/', include('apps.expenses.urls')),
    path('api/groups/', include('apps.groups.urls')),
    path('api/payments/', include('apps.payments.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/core/', include('apps.core.urls')),
    path('api/budget/', include('apps.budget.urls')),
    path('api/enterprise/', include('apps.enterprise.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
