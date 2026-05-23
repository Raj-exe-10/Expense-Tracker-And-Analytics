from rest_framework import serializers
from apps.core.models import Currency
from .models import SavingsGoal
from .serializers import CurrencySimpleSerializer


def _currency_for_user(user):
    currency = Currency.objects.filter(code=user.preferred_currency).first()
    if not currency:
        currency = Currency.objects.filter(code='USD').first()
    return currency


class SavingsGoalSerializer(serializers.ModelSerializer):
    progress_percent = serializers.FloatField(read_only=True)
    currency_detail = CurrencySimpleSerializer(source='currency', read_only=True)

    class Meta:
        model = SavingsGoal
        fields = [
            'id', 'name', 'target_amount', 'current_amount', 'target_date',
            'currency', 'currency_detail', 'is_active', 'progress_percent',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'progress_percent']
        extra_kwargs = {'currency': {'required': False}}

    def create(self, validated_data):
        user = self.context['request'].user
        if 'currency' not in validated_data:
            currency = _currency_for_user(user)
            if not currency:
                raise serializers.ValidationError(
                    {'currency': 'No currency available for your preferred currency.'}
                )
            validated_data['currency'] = currency
        validated_data['user'] = user
        return super().create(validated_data)
