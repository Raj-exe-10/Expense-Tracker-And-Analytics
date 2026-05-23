from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EntityViewSet, AuditEventViewSet, ExportJobViewSet

router = DefaultRouter()
router.register(r'entities', EntityViewSet, basename='entity')
router.register(r'audit', AuditEventViewSet, basename='audit-event')
router.register(r'exports', ExportJobViewSet, basename='export-job')

urlpatterns = [
    path('', include(router.urls)),
]
