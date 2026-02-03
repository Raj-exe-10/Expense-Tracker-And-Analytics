from rest_framework import serializers
from django.core.exceptions import ValidationError
from decimal import Decimal

from .models import (
    Wallet,
    WalletCategory,
    UserCategory,
    MonthlyBudget,
    WalletAllocation,
    WalletAdjustment,
)
from .services import (
    remaining_balance,
    get_spent_for_wallet_allocation,
    get_adjustments_total,
    ensure_monthly_budget,
    apply_rollover,
)
from apps.core.models import Category, Currency


class WalletSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wallet
        fields = [
            'id', 'name', 'wallet_type', 'rollover_enabled', 'order',
            'color', 'icon', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def validate_name(self, value):
        if not value or not value.strip():
            raise ValidationError('Wallet name is required.')
        name = value.strip()
        user = self.context.get('request').user if self.context.get('request') else None
        if user:
            qs = Wallet.objects.filter(user=user, name__iexact=name)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise ValidationError('A wallet with this name already exists.')
        return name


class WalletCategorySerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_icon = serializers.CharField(source='category.icon', read_only=True)
    category_color = serializers.CharField(source='category.color', read_only=True)

    class Meta:
        model = WalletCategory
        fields = ['id', 'wallet', 'category', 'category_name', 'category_icon', 'category_color']
        read_only_fields = ['id']


class UserCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = UserCategory
        fields = ['id', 'wallet', 'name', 'icon', 'color', 'created_at']
        read_only_fields = ['id', 'created_at']


class WalletAdjustmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = WalletAdjustment
        fields = ['id', 'monthly_budget', 'wallet', 'amount', 'note', 'created_at']
        read_only_fields = ['id', 'created_at']


class CurrencySimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Currency
        fields = ['id', 'code', 'symbol']


class WalletAllocationSerializer(serializers.ModelSerializer):
    wallet_name = serializers.CharField(source='wallet.name', read_only=True)
    wallet_type = serializers.CharField(source='wallet.wallet_type', read_only=True)
    spent = serializers.SerializerMethodField()
    remaining = serializers.SerializerMethodField()
    adjustments_total = serializers.SerializerMethodField()

    class Meta:
        model = WalletAllocation
        fields = [
            'id', 'monthly_budget', 'wallet', 'wallet_name', 'wallet_type',
            'amount', 'rollover_from_previous', 'accumulated_balance',
            'spent', 'remaining', 'adjustments_total', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def get_spent(self, obj):
        request = self.context.get('request')
        scope = request.query_params.get('scope', 'personal') if request else 'personal'
        return get_spent_for_wallet_allocation(obj, obj.wallet, scope=scope)

    def get_remaining(self, obj):
        request = self.context.get('request')
        scope = request.query_params.get('scope', 'personal') if request else 'personal'
        return remaining_balance(obj, scope=scope)

    def get_adjustments_total(self, obj):
        return get_adjustments_total(obj)


class MonthlyBudgetSerializer(serializers.ModelSerializer):
    currency_detail = CurrencySimpleSerializer(source='currency', read_only=True)
    allocated_amount = serializers.DecimalField(
        max_digits=15, decimal_places=2, read_only=True
    )
    unassigned_amount = serializers.DecimalField(
        max_digits=15, decimal_places=2, read_only=True
    )
    wallet_allocations = WalletAllocationSerializer(many=True, read_only=True)

    class Meta:
        model = MonthlyBudget
        fields = [
            'id', 'year', 'month', 'total_amount', 'currency', 'currency_detail',
            'allocated_amount', 'unassigned_amount', 'wallet_allocations',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep['allocated_amount'] = instance.allocated_amount()
        rep['unassigned_amount'] = instance.unassigned_amount
        return rep


class MonthlyBudgetWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = MonthlyBudget
        fields = ['id', 'year', 'month', 'total_amount', 'currency']

    def validate(self, data):
        total = data.get('total_amount') or Decimal('0')
        if total < 0:
            raise ValidationError({'total_amount': 'Cannot be negative.'})
        return data


class WalletAllocationWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = WalletAllocation
        fields = ['id', 'monthly_budget', 'wallet', 'amount', 'rollover_from_previous', 'accumulated_balance']

    def validate(self, data):
        budget = data.get('monthly_budget')
        wallet = data.get('wallet')
        amount = data.get('amount') or Decimal('0')
        if budget and wallet and budget.user != wallet.user:
            raise ValidationError('Wallet must belong to the budget user.')
        if budget and amount > 0:
            allocated = budget.allocated_amount()
            # Exclude current allocation if updating
            instance = self.instance
            if instance:
                allocated -= instance.amount
            if allocated + amount > budget.total_amount:
                raise ValidationError(
                    {'amount': f'Total wallet allocations cannot exceed monthly budget ({budget.total_amount}).'}
                )
        return data
