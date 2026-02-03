from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'wallets', views.WalletViewSet)
router.register(r'wallet-categories', views.WalletCategoryViewSet)
router.register(r'user-categories', views.UserCategoryViewSet)
router.register(r'monthly-budgets', views.MonthlyBudgetViewSet)
router.register(r'allocations', views.WalletAllocationViewSet)
router.register(r'adjustments', views.WalletAdjustmentViewSet)
router.register(r'categories', views.BudgetCategoriesViewSet, basename='budget-categories')

urlpatterns = [
    path('', include(router.urls)),
]
