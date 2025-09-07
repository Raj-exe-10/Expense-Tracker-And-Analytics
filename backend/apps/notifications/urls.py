from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
# router.register(r'notifications', views.NotificationViewSet)

urlpatterns = [
    # Notification endpoints
    # path('mark-read/', views.MarkNotificationsReadView.as_view(), name='mark_notifications_read'),
    # path('preferences/', views.NotificationPreferencesView.as_view(), name='notification_preferences'),
    # path('test/', views.TestNotificationView.as_view(), name='test_notification'),
    
    # Router URLs
    path('', include(router.urls)),
]
