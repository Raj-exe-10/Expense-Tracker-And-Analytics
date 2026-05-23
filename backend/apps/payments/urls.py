from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .payment_request_views import PaymentRequestViewSet
from .settlement_reports import settlement_reports

router = DefaultRouter()
router.register(r'settlements', views.SettlementViewSet, basename='settlement')
router.register(r'payment-methods', views.PaymentMethodViewSet, basename='payment-method')
router.register(r'payment-requests', PaymentRequestViewSet, basename='payment-request')

urlpatterns = [
    path('settlement-reports/', settlement_reports, name='settlement_reports'),
    path('balances/', views.user_balances, name='user_balances'),
    path('groups/<uuid:group_id>/balances/', views.group_balances, name='group_balances'),
    path('settle/', views.create_settlement, name='create_settlement'),
    path('quick-settle/', views.quick_settle, name='quick_settle'),
    path('send-reminder/', views.send_reminder, name='send_reminder'),
    path('history/', views.transaction_history, name='transaction_history'),
    path('expense-settlements/', views.expense_settlements, name='expense_settlements'),
    path('expense-settlements/<uuid:share_id>/settle/', views.settle_expense_share, name='settle_expense_share'),
    path('', include(router.urls)),
]
