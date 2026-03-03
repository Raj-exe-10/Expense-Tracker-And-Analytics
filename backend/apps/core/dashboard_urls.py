from django.urls import path
from .dashboard import dashboard_summary

urlpatterns = [
    path('', dashboard_summary, name='dashboard_summary'),
]
