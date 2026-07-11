from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Settlement, PaymentMethod, Payment
from apps.core.models import Currency
from apps.groups.models import Group

User = get_user_model()


class UserSimpleSerializer(serializers.ModelSerializer):
    """Simple user serializer for nested representations"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = fields


class PaymentMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentMethod
        fields = [
            'id', 'method_type', 'name', 'details', 'is_active',
            'is_verified', 'is_default', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class SettlementSerializer(serializers.ModelSerializer):
    payer = UserSimpleSerializer(read_only=True)
    payee = UserSimpleSerializer(read_only=True)
    payer_id = serializers.UUIDField(write_only=True, required=False)
    payee_id = serializers.UUIDField(write_only=True, required=False)
    currency = serializers.PrimaryKeyRelatedField(queryset=Currency.objects.all())
    group = serializers.PrimaryKeyRelatedField(
        queryset=Group.objects.all(),
        required=False,
        allow_null=True
    )
    payment_method = PaymentMethodSerializer(read_only=True)
    payment_method_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = Settlement
        fields = [
            'id', 'payer', 'payer_id', 'payee', 'payee_id', 'amount', 'currency',
            'group', 'method', 'status', 'payment_method', 'payment_method_id',
            'external_transaction_id', 'payment_service', 'due_date', 'completed_at',
            'description', 'notes', 'is_confirmed_by_payer', 'is_confirmed_by_payee',
            'confirmed_at', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'payer', 'payee', 'status', 'completed_at', 'confirmed_at',
            'created_at', 'updated_at'
        ]
    
    def validate(self, data):
        """Validate settlement data"""
        if data.get('amount') and data['amount'] <= 0:
            raise serializers.ValidationError("Amount must be greater than 0")
        return data
    
    def create(self, validated_data):
        # payer_id from client is ignored; ViewSet sets payer=request.user
        validated_data.pop('payer_id', None)
        payee_id = validated_data.pop('payee_id', None)
        payment_method_id = validated_data.pop('payment_method_id', None)

        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            validated_data['payer'] = request.user
        if payee_id:
            validated_data['payee'] = User.objects.get(id=payee_id)
        if payment_method_id:
            validated_data['payment_method'] = PaymentMethod.objects.get(id=payment_method_id)

        if validated_data.get('payer') and validated_data.get('payee'):
            if validated_data['payer'].id == validated_data['payee'].id:
                raise serializers.ValidationError({'payee_id': 'Payer and payee must differ.'})

        return Settlement.objects.create(**validated_data)


class PaymentSerializer(serializers.ModelSerializer):
    settlement = SettlementSerializer(read_only=True)
    settlement_id = serializers.UUIDField(write_only=True)
    currency = serializers.PrimaryKeyRelatedField(queryset=Currency.objects.all())
    payment_method = PaymentMethodSerializer(read_only=True)
    payment_method_id = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'settlement', 'settlement_id', 'amount', 'currency',
            'payment_method', 'payment_method_id', 'status',
            'external_transaction_id', 'payment_service', 'processing_fee',
            'initiated_at', 'processed_at', 'metadata', 'error_code',
            'error_message', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'status', 'initiated_at', 'processed_at', 'created_at', 'updated_at'
        ]
