from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/', views.dashboard_stats, name='dashboard_analytics'),
    path('expenses/trends/', views.expense_trends, name='expense_trends'),
    path('categories/breakdown/', views.category_breakdown, name='category_breakdown'),
    path('groups/<uuid:group_id>/analytics/', views.group_analytics, name='group_analytics'),
    path('export/<str:format>/', views.export_data, name='export_data'),
]
