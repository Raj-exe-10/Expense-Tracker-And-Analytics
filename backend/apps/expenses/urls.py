from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .sync_views import sync_expenses, resolve_conflict

router = DefaultRouter()
router.register(r'expenses', views.ExpenseViewSet, basename='expense')
router.register(r'recurring', views.RecurringExpenseViewSet, basename='recurring-expense')
router.register(r'shares', views.ExpenseShareViewSet, basename='expense-share')

urlpatterns = [
    path('sync/', sync_expenses, name='sync_expenses'),
    path('sync/resolve/', resolve_conflict, name='resolve_conflict'),
    # Expense management endpoints
    # path('expenses/<uuid:pk>/split/', views.UpdateExpenseSplitView.as_view(), name='update_expense_split'),
    # path('expenses/<uuid:pk>/settle/', views.SettleExpenseView.as_view(), name='settle_expense'),
    # path('expenses/upload/', views.ReceiptUploadView.as_view(), name='upload_receipt'),
    # path('expenses/ocr/', views.OCRProcessView.as_view(), name='process_ocr'),
    
    # Router URLs
    path('', include(router.urls)),
]
