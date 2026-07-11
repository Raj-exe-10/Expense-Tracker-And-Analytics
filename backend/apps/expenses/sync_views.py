from django.db import transaction
from django.db.models import Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Expense
from .serializers import ExpenseSerializer


def _accessible_expense_qs(user):
    """Expenses the user may sync: payer, share participant, or active group member."""
    return Expense.objects.filter(
        is_deleted=False,
    ).filter(
        Q(paid_by=user) |
        Q(shares__user=user) |
        Q(group__memberships__user=user, group__memberships__is_active=True)
    ).distinct()


def _get_accessible_expense(user, expense_id, *, for_update=False):
    qs = _accessible_expense_qs(user)
    if for_update:
        qs = qs.select_for_update()
    try:
        return qs.get(id=expense_id)
    except Expense.DoesNotExist:
        return None
    except (ValueError, TypeError):
        return None


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sync_expenses(request):
    """Apply batched offline changes; return conflicts for manual resolution."""
    items = request.data.get('items', [])
    conflicts = []
    applied = []

    for item in items:
        expense_id = item.get('id')
        base_version = item.get('base_version')
        payload = item.get('data', {})
        resolution = item.get('resolution')

        if expense_id and resolution in ('local', 'server'):
            with transaction.atomic():
                expense = _get_accessible_expense(request.user, expense_id, for_update=True)
                if expense is None:
                    conflicts.append({'id': expense_id, 'reason': 'not_found'})
                    continue
                if resolution == 'local':
                    serializer = ExpenseSerializer(
                        expense, data=payload, partial=True, context={'request': request}
                    )
                    if serializer.is_valid():
                        expense = serializer.save()
                        expense.version += 1
                        expense.save(update_fields=['version'])
                        applied.append(str(expense.id))
                else:
                    # Keep server data; do not bump version
                    applied.append(str(expense.id))
            continue

        if expense_id:
            with transaction.atomic():
                expense = _get_accessible_expense(request.user, expense_id, for_update=True)
                if expense is None:
                    conflicts.append({'id': expense_id, 'reason': 'not_found'})
                    continue
                if base_version is None:
                    conflicts.append({
                        'id': str(expense.id),
                        'reason': 'base_version_required',
                        'server': ExpenseSerializer(expense).data,
                        'server_version': expense.version,
                    })
                    continue
                if int(base_version) != expense.version:
                    conflicts.append({
                        'id': str(expense.id),
                        'local': payload,
                        'server': ExpenseSerializer(expense).data,
                        'local_version': base_version,
                        'server_version': expense.version,
                    })
                    continue
                serializer = ExpenseSerializer(
                    expense, data=payload, partial=True, context={'request': request}
                )
                if serializer.is_valid():
                    expense = serializer.save()
                    expense.version += 1
                    expense.save(update_fields=['version'])
                    applied.append(str(expense.id))
        else:
            serializer = ExpenseSerializer(data=payload, context={'request': request})
            if serializer.is_valid():
                expense = serializer.save(paid_by=request.user, version=1)
                applied.append(str(expense.id))

    return Response({'applied': applied, 'conflicts': conflicts})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def resolve_conflict(request):
    expense_id = request.data.get('id')
    choice = request.data.get('choice')
    data = request.data.get('data', {})
    base_version = request.data.get('base_version')

    with transaction.atomic():
        expense = _get_accessible_expense(request.user, expense_id, for_update=True)
        if expense is None:
            return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

        if choice == 'local':
            if base_version is not None and int(base_version) != expense.version:
                return Response(
                    {
                        'detail': 'Version conflict',
                        'server_version': expense.version,
                        'server': ExpenseSerializer(expense).data,
                    },
                    status=status.HTTP_409_CONFLICT,
                )
            serializer = ExpenseSerializer(
                expense, data=data, partial=True, context={'request': request}
            )
            if serializer.is_valid():
                expense = serializer.save()
                expense.version += 1
                expense.save(update_fields=['version'])
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        # choice == 'server': keep data, do not bump version

    return Response(ExpenseSerializer(expense).data)
