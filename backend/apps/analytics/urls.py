from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()

urlpatterns = [
    # Analytics endpoints
    # path('dashboard/', views.DashboardAnalyticsView.as_view(), name='dashboard_analytics'),
    # path('expenses/trends/', views.ExpenseTrendsView.as_view(), name='expense_trends'),
    # path('groups/<uuid:pk>/analytics/', views.GroupAnalyticsView.as_view(), name='group_analytics'),
    # path('export/csv/', views.ExportCSVView.as_view(), name='export_csv'),
    # path('export/pdf/', views.ExportPDFView.as_view(), name='export_pdf'),
    
    # Router URLs
    path('', include(router.urls)),
]
