from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .fixed_cost_views import FixedCostViewSet
from .savings_goal_views import SavingsGoalViewSet

router = DefaultRouter()
router.register(r'fixed-costs', FixedCostViewSet, basename='fixed-cost')
router.register(r'savings-goals', SavingsGoalViewSet, basename='savings-goal')
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
