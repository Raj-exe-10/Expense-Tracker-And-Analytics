from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.groups.models import GroupMembership

from .post_game_service import build_post_game_payload


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def post_game_analytics(request):
  scope = request.query_params.get('scope', 'personal')
  if scope not in ('personal', 'group', 'combined'):
    scope = 'personal'

  year = request.query_params.get('year')
  month = request.query_params.get('month')

  payload = build_post_game_payload(
    request.user,
    year=int(year) if year else None,
    month=int(month) if month else None,
    scope=scope,
  )

  has_groups = GroupMembership.objects.filter(user=request.user, is_active=True).exists()
  payload['meta']['has_groups'] = has_groups

  return Response(payload)
