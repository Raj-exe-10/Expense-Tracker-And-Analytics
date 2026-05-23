from decimal import Decimal
from django.db.models import Sum, Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.groups.models import Group, GroupMembership
from apps.expenses.models import Expense, ExpenseShare


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def settlement_reports(request):
    user = request.user
    group_ids = GroupMembership.objects.filter(user=user, is_active=True).values_list('group_id', flat=True)
    squads = []
    for group in Group.objects.filter(id__in=group_ids, is_active=True):
        total = Expense.objects.filter(group=group, is_deleted=False).aggregate(s=Sum('amount'))['s'] or Decimal('0')
        shares = ExpenseShare.objects.filter(expense__group=group, user=user, expense__is_deleted=False)
        your_share = shares.aggregate(s=Sum('amount'))['s'] or Decimal('0')
        unsettled = shares.filter(is_settled=False).aggregate(s=Sum('amount'))['s'] or Decimal('0')
        settled_pct = 100
        if your_share > 0:
            settled_pct = int(((your_share - unsettled) / your_share) * 100)
        owed_to_you = ExpenseShare.objects.filter(
            expense__group=group, paid_by=user, is_settled=False, expense__is_deleted=False
        ).exclude(user=user).aggregate(s=Sum('amount'))['s'] or Decimal('0')
        you_owe = ExpenseShare.objects.filter(
            expense__group=group, user=user, is_settled=False, expense__is_deleted=False
        ).exclude(paid_by=user).aggregate(s=Sum('amount'))['s'] or Decimal('0')
        net = float(owed_to_you - you_owe)
        squads.append({
            'id': str(group.id),
            'name': group.name,
            'group_type': group.group_type,
            'total_spend': float(total),
            'your_share': float(your_share),
            'settled_percent': settled_pct,
            'net_position': net,
            'status': 'receive' if net > 0 else ('owe' if net < 0 else 'balanced'),
        })
    total_net = sum(s['net_position'] for s in squads)
    return Response({
        'net_position': round(total_net, 2),
        'squads': squads,
    })
