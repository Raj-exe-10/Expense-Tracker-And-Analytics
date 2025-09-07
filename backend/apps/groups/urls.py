from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'groups', views.GroupViewSet, basename='group')

urlpatterns = [
    # Group management endpoints
    # path('groups/<uuid:pk>/join/', views.JoinGroupView.as_view(), name='join_group'),
    # path('groups/<uuid:pk>/leave/', views.LeaveGroupView.as_view(), name='leave_group'),
    # path('groups/<uuid:pk>/balances/', views.GroupBalancesView.as_view(), name='group_balances'),
    # path('groups/<uuid:pk>/activities/', views.GroupActivitiesView.as_view(), name='group_activities'),
    
    # Router URLs
    path('', include(router.urls)),
]
