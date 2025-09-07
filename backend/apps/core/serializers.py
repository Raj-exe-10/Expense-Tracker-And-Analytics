from rest_framework import serializers
from .models import Currency, Category, Tag, Country, SystemConfiguration


class CurrencySerializer(serializers.ModelSerializer):
    """Currency serializer"""
    
    class Meta:
        model = Currency
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class CategorySerializer(serializers.ModelSerializer):
    """Category serializer with hierarchical support"""
    
    subcategories = serializers.SerializerMethodField()
    parent_name = serializers.CharField(source='parent.name', read_only=True)
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    
    class Meta:
        model = Category
        fields = [
            'id', 'name', 'slug', 'description', 'icon', 'color',
            'is_default', 'parent', 'parent_name', 'full_name',
            'subcategories', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'full_name']
    
    def get_subcategories(self, obj):
        if obj.subcategories.exists():
            return CategorySerializer(obj.subcategories.all(), many=True, context=self.context).data
        return []


class SimpleCategorySerializer(serializers.ModelSerializer):
    """Simple category serializer without subcategories"""
    
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'icon', 'color', 'full_name']


class TagSerializer(serializers.ModelSerializer):
    """Tag serializer"""
    
    class Meta:
        model = Tag
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'usage_count']


class CountrySerializer(serializers.ModelSerializer):
    """Country serializer"""
    
    currency_details = CurrencySerializer(source='currency', read_only=True)
    
    class Meta:
        model = Country
        fields = [
            'id', 'name', 'code', 'currency', 'currency_details',
            'phone_code', 'flag_emoji', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class SystemConfigurationSerializer(serializers.ModelSerializer):
    """System configuration serializer"""
    
    parsed_value = serializers.SerializerMethodField()
    
    class Meta:
        model = SystemConfiguration
        fields = [
            'id', 'key', 'value', 'parsed_value', 'data_type',
            'description', 'is_sensitive', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'parsed_value']
    
    def get_parsed_value(self, obj):
        if obj.is_sensitive:
            return '***'
        return obj.get_value()


class CurrencyExchangeRateSerializer(serializers.Serializer):
    """Currency exchange rate serializer"""
    
    from_currency = serializers.CharField()
    to_currency = serializers.CharField()
    amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    converted_amount = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    exchange_rate = serializers.DecimalField(max_digits=20, decimal_places=10, read_only=True)
    last_updated = serializers.DateTimeField(read_only=True)
