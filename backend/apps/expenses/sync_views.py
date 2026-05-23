from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Expense
from .serializers import ExpenseSerializer


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
            try:
                expense = Expense.objects.get(id=expense_id, is_deleted=False)
            except Expense.DoesNotExist:
                continue
            if resolution == 'local':
                serializer = ExpenseSerializer(expense, data=payload, partial=True, context={'request': request})
                if serializer.is_valid():
                    expense = serializer.save()
                    expense.version += 1
                    expense.save(update_fields=['version'])
                    applied.append(str(expense.id))
            else:
                applied.append(str(expense.id))
            continue

        if expense_id:
            try:
                expense = Expense.objects.get(id=expense_id, is_deleted=False)
            except Expense.DoesNotExist:
                conflicts.append({'id': expense_id, 'reason': 'not_found'})
                continue
            if base_version is not None and int(base_version) != expense.version:
                conflicts.append({
                    'id': str(expense.id),
                    'local': payload,
                    'server': ExpenseSerializer(expense).data,
                    'local_version': base_version,
                    'server_version': expense.version,
                })
                continue
            serializer = ExpenseSerializer(expense, data=payload, partial=True, context={'request': request})
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
    try:
        expense = Expense.objects.get(id=expense_id, is_deleted=False)
    except Expense.DoesNotExist:
        return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    if choice == 'local':
        serializer = ExpenseSerializer(expense, data=data, partial=True, context={'request': request})
        if serializer.is_valid():
            expense = serializer.save()
    expense.version += 1
    expense.save(update_fields=['version'])
    return Response(ExpenseSerializer(expense).data)
