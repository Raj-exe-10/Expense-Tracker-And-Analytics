from django.urls import path
from . import views
from . import extended_views
from . import post_game_views

urlpatterns = [
    path('dashboard/', views.dashboard_stats, name='dashboard_analytics'),
    path('expenses/trends/', views.expense_trends, name='expense_trends'),
    path('categories/breakdown/', views.category_breakdown, name='category_breakdown'),
    path('groups/<uuid:group_id>/analytics/', views.group_analytics, name='group_analytics'),
    path('export/<str:format>/', views.export_data, name='export_data'),
    path('flow/', extended_views.spending_flow, name='spending_flow'),
    path('spending-intensity/', extended_views.spending_intensity, name='spending_intensity'),
    path('insights/', extended_views.smart_insights, name='smart_insights'),
    path('post-game/', post_game_views.post_game_analytics, name='post_game_analytics'),
]
