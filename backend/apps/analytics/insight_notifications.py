"""Create in-app notifications for critical post-game insights."""
from datetime import timedelta

from django.utils import timezone

from apps.notifications.models import Notification
from apps.notifications.services import NotificationService


def notify_critical_insights(user, insights):
    """Dedupe: one notification per insight_key per 24h."""
    cutoff = timezone.now() - timedelta(hours=24)
    for ins in insights:
        if ins.get('severity') != 'critical':
            continue
        key = ins.get('insight_key') or ins.get('id')
        if not key:
            continue
        exists = Notification.objects.filter(
            user=user,
            notification_type='system',
            metadata__insight_key=key,
            created_at__gte=cutoff,
        ).exists()
        if exists:
            continue
        NotificationService.create_notification(
            user=user,
            notification_type='system',
            title=ins.get('title', 'Analytics alert'),
            message=ins.get('detail', ''),
            priority='high',
            action_url='',
            metadata={
                'insight_key': key,
                'source': ins.get('source', 'rule'),
                'action_path': ins.get('action', '/app/analytics/post-game'),
            },
        )
