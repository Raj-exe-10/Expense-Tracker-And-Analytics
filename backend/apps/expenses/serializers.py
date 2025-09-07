from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Expense, ExpenseShare, RecurringExpense, ExpenseComment
from apps.core.models import Category, Currency, Tag
from apps.groups.models import Group

User = get_user_model()


class UserSimpleSerializer(serializers.ModelSerializer):
    """Simple user serializer for nested representations"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = fields


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'icon', 'color', 'description']
        read_only_fields = ['id']


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'color']
        read_only_fields = ['id']


class ExpenseShareSerializer(serializers.ModelSerializer):
    user = UserSimpleSerializer(read_only=True)
    user_id = serializers.UUIDField(write_only=True, required=False)
    
    class Meta:
        model = ExpenseShare
        fields = [
            'id', 'expense', 'user', 'user_id', 'amount', 
            'percentage', 'is_settled', 'settled_at'
        ]
        read_only_fields = ['id', 'expense', 'settled_at']
    
    def validate(self, data):
        """Validate share data"""
        if data.get('percentage'):
            if data['percentage'] < 0 or data['percentage'] > 100:
                raise serializers.ValidationError("Percentage must be between 0 and 100")
        
        if data.get('amount'):
            if data['amount'] < 0:
                raise serializers.ValidationError("Amount cannot be negative")
        
        return data


class ExpenseCommentSerializer(serializers.ModelSerializer):
    user = UserSimpleSerializer(read_only=True)
    
    class Meta:
        model = ExpenseComment
        fields = ['id', 'expense', 'user', 'comment', 'created_at']
        read_only_fields = ['id', 'expense', 'user', 'created_at']


class ExpenseSerializer(serializers.ModelSerializer):
    created_by = UserSimpleSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    category_id = serializers.UUIDField(write_only=True, required=False)
    group = serializers.PrimaryKeyRelatedField(
        queryset=Group.objects.all(),
        required=False,
        allow_null=True
    )
    currency = serializers.PrimaryKeyRelatedField(
        queryset=Currency.objects.all(),
        required=False
    )
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False
    )
    shares = ExpenseShareSerializer(many=True, read_only=True)
    shares_data = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False
    )
    comments_count = serializers.SerializerMethodField()
    total_shares = serializers.SerializerMethodField()
    
    class Meta:
        model = Expense
        fields = [
            'id', 'description', 'amount', 'currency', 'date', 
            'category', 'category_id', 'group', 'created_by',
            'receipt_image', 'notes', 'tags', 'tag_ids',
            'is_settled', 'settled_at', 'shares', 'shares_data',
            'comments_count', 'total_shares', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'created_by', 'created_at', 'updated_at', 
            'settled_at', 'comments_count', 'total_shares'
        ]
    
    def get_comments_count(self, obj):
        return obj.comments.count()
    
    def get_total_shares(self, obj):
        return obj.shares.count()
    
    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than 0")
        return value
    
    def create(self, validated_data):
        # Extract nested data
        tag_ids = validated_data.pop('tag_ids', [])
        shares_data = validated_data.pop('shares_data', [])
        category_id = validated_data.pop('category_id', None)
        
        # Set category
        if category_id:
            validated_data['category'] = Category.objects.get(id=category_id)
        
        # Create expense
        expense = Expense.objects.create(**validated_data)
        
        # Add tags
        if tag_ids:
            tags = Tag.objects.filter(id__in=tag_ids)
            expense.tags.set(tags)
        
        # Create shares
        for share_data in shares_data:
            ExpenseShare.objects.create(
                expense=expense,
                user_id=share_data.get('user_id'),
                amount=share_data.get('amount', 0),
                percentage=share_data.get('percentage', 0)
            )
        
        return expense
    
    def update(self, instance, validated_data):
        # Extract nested data
        tag_ids = validated_data.pop('tag_ids', None)
        shares_data = validated_data.pop('shares_data', None)
        category_id = validated_data.pop('category_id', None)
        
        # Update category
        if category_id:
            validated_data['category'] = Category.objects.get(id=category_id)
        
        # Update expense fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update tags
        if tag_ids is not None:
            tags = Tag.objects.filter(id__in=tag_ids)
            instance.tags.set(tags)
        
        # Update shares if provided
        if shares_data is not None:
            # Delete existing shares
            instance.shares.all().delete()
            
            # Create new shares
            for share_data in shares_data:
                ExpenseShare.objects.create(
                    expense=instance,
                    user_id=share_data.get('user_id'),
                    amount=share_data.get('amount', 0),
                    percentage=share_data.get('percentage', 0)
                )
        
        return instance


class RecurringExpenseSerializer(serializers.ModelSerializer):
    created_by = UserSimpleSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    category_id = serializers.UUIDField(write_only=True, required=False)
    group = serializers.PrimaryKeyRelatedField(
        queryset=Group.objects.all(),
        required=False,
        allow_null=True
    )
    currency = serializers.PrimaryKeyRelatedField(
        queryset=Currency.objects.all(),
        required=False
    )
    next_due_date = serializers.SerializerMethodField()
    
    class Meta:
        model = RecurringExpense
        fields = [
            'id', 'description', 'amount', 'currency', 'category',
            'category_id', 'group', 'frequency', 'start_date',
            'end_date', 'last_generated', 'is_active', 'created_by',
            'next_due_date', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'created_by', 'last_generated', 
            'created_at', 'updated_at', 'next_due_date'
        ]
    
    def get_next_due_date(self, obj):
        if hasattr(obj, 'get_next_due_date'):
            next_date = obj.get_next_due_date()
            return next_date.isoformat() if next_date else None
        return None
    
    def validate(self, data):
        """Validate recurring expense data"""
        if data.get('end_date') and data.get('start_date'):
            if data['end_date'] <= data['start_date']:
                raise serializers.ValidationError(
                    "End date must be after start date"
                )
        
        if data.get('frequency') not in ['daily', 'weekly', 'monthly', 'yearly']:
            raise serializers.ValidationError(
                "Invalid frequency. Choose from: daily, weekly, monthly, yearly"
            )
        
        return data
    
    def create(self, validated_data):
        category_id = validated_data.pop('category_id', None)
        
        if category_id:
            validated_data['category'] = Category.objects.get(id=category_id)
        
        return RecurringExpense.objects.create(**validated_data)
    
    def update(self, instance, validated_data):
        category_id = validated_data.pop('category_id', None)
        
        if category_id:
            validated_data['category'] = Category.objects.get(id=category_id)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        return instance
