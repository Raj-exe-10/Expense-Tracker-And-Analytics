from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'settlements', views.SettlementViewSet, basename='settlement')
router.register(r'payment-methods', views.PaymentMethodViewSet, basename='payment-method')

urlpatterns = [
    path('balances/', views.user_balances, name='user_balances'),
    path('groups/<uuid:group_id>/balances/', views.group_balances, name='group_balances'),
    path('settle/', views.create_settlement, name='create_settlement'),
    path('', include(router.urls)),
]
