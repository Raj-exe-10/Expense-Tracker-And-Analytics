from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import FixedCost
from rest_framework import serializers


class FixedCostSerializer(serializers.ModelSerializer):
    currency_code = serializers.CharField(source='currency.code', read_only=True)

    class Meta:
        model = FixedCost
        fields = [
            'id', 'name', 'amount', 'currency', 'currency_code',
            'due_day_of_month', 'icon', 'category_label', 'is_active',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class FixedCostViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = FixedCostSerializer

    def get_queryset(self):
        return FixedCost.objects.filter(user=self.request.user).select_related('currency')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        from datetime import date
        today = date.today()
        costs = self.get_queryset().filter(is_active=True)[:10]
        data = []
        for fc in costs:
            data.append({
                'id': str(fc.id),
                'name': fc.name,
                'amount': float(fc.amount),
                'currency': fc.currency.code if fc.currency else 'USD',
                'due_day_of_month': fc.due_day_of_month,
                'days_until': max(0, fc.due_day_of_month - today.day),
            })
        return Response(data)
