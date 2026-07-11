from datetime import timedelta

from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

from apps.enterprise.permissions import IsEnterpriseAdmin
from .models import SystemLog
from .system_log_serializers import SystemLogSerializer


class SystemLogPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = 'page_size'
    max_page_size = 100


class SystemLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Admin-only unified application logs."""
    permission_classes = [IsEnterpriseAdmin]
    serializer_class = SystemLogSerializer
    pagination_class = SystemLogPagination

    def get_queryset(self):
        qs = SystemLog.objects.select_related('user').all()
        params = self.request.query_params

        level = params.get('level')
        if level:
            qs = qs.filter(level=level)

        category = params.get('category')
        if category:
            qs = qs.filter(category=category)

        status = params.get('status_code')
        if status:
            qs = qs.filter(status_code=status)

        user_id = params.get('user_id')
        if user_id:
            qs = qs.filter(user_id=user_id)

        path = params.get('path')
        if path:
            qs = qs.filter(request_path__icontains=path)

        search = params.get('search')
        if search:
            qs = qs.filter(
                Q(message__icontains=search)
                | Q(request_path__icontains=search)
                | Q(user__email__icontains=search)
            )

        hours = params.get('hours')
        if hours:
            try:
                since = timezone.now() - timedelta(hours=int(hours))
                qs = qs.filter(created_at__gte=since)
            except ValueError:
                pass

        return qs

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Health summary for the last 24 hours."""
        since = timezone.now() - timedelta(hours=24)
        base = SystemLog.objects.filter(created_at__gte=since)
        by_level = dict(
            base.values('level').annotate(c=Count('id')).values_list('level', 'c')
        )
        by_category = dict(
            base.values('category').annotate(c=Count('id')).values_list('category', 'c')
        )
        errors_4xx = base.filter(status_code__gte=400, status_code__lt=500).count()
        errors_5xx = base.filter(status_code__gte=500).count()
        slow = base.filter(duration_ms__gte=2000).count()
        return Response({
            'window_hours': 24,
            'total': base.count(),
            'by_level': by_level,
            'by_category': by_category,
            'http_4xx': errors_4xx,
            'http_5xx': errors_5xx,
            'slow_requests': slow,
        })
