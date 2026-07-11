from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .system_log_views import SystemLogViewSet

router = DefaultRouter()
router.register(r'currencies', views.CurrencyViewSet)
router.register(r'categories', views.CategoryViewSet)
router.register(r'tags', views.TagViewSet)
router.register(r'countries', views.CountryViewSet)
router.register(r'system-logs', SystemLogViewSet, basename='system-log')

urlpatterns = [
    # Utility endpoints
    path('health/', views.HealthCheckView.as_view(), name='health_check'),
    path('currencies/rates/', views.CurrencyRatesView.as_view(), name='currency_rates'),
    
    # Router URLs
    path('', include(router.urls)),
]
