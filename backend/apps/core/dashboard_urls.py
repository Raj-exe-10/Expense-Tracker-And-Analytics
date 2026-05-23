from django.urls import path
from .dashboard import dashboard_summary
from .home_dashboard import home_dashboard

urlpatterns = [
    path('', dashboard_summary, name='dashboard_summary'),
    path('home/', home_dashboard, name='home_dashboard'),
]
