from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
# router.register(r'settlements', views.SettlementViewSet)
# router.register(r'payment-methods', views.PaymentMethodViewSet)

urlpatterns = [
    # Payment endpoints
    # path('settle/', views.CreateSettlementView.as_view(), name='create_settlement'),
    # path('payments/stripe/webhook/', views.StripeWebhookView.as_view(), name='stripe_webhook'),
    # path('payments/paypal/webhook/', views.PayPalWebhookView.as_view(), name='paypal_webhook'),
    
    # Router URLs
    path('', include(router.urls)),
]
