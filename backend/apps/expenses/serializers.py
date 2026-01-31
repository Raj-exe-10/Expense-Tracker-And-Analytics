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
            'currency', 'paid_by', 'is_settled', 'settled_at'
        ]
        read_only_fields = ['id', 'expense', 'settled_at']
    
    def validate(self, data):
        """Validate share data"""
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
    paid_by = UserSimpleSerializer(read_only=True)
    created_by = serializers.SerializerMethodField()  # Alias for paid_by for backward compatibility
    category = CategorySerializer(read_only=True)
    category_id = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)
    group = serializers.PrimaryKeyRelatedField(
        queryset=Group.objects.all(),
        required=False,
        allow_null=True
    )
    currency = serializers.PrimaryKeyRelatedField(
        queryset=Currency.objects.all(),
        required=True
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
    date = serializers.DateField(source='expense_date', required=False)  # Alias for expense_date - frontend sends 'date'
    expense_date = serializers.DateField(required=False, allow_null=True)  # Explicit field - can be sent directly
    receipt_image = serializers.ImageField(source='receipt', required=False)  # Alias for receipt
    
    class Meta:
        model = Expense
        fields = [
            'id', 'title', 'description', 'amount', 'currency', 'expense_date', 'date',
            'category', 'category_id', 'group', 'paid_by', 'created_by',
            'receipt', 'receipt_image', 'tags', 'tag_ids',
            'is_settled', 'shares', 'shares_data',
            'comments_count', 'total_shares', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'paid_by', 'created_at', 'updated_at', 
            'comments_count', 'total_shares'
        ]
    
    def to_internal_value(self, data):
        """Map 'date' to 'expense_date' before validation and handle ID conversions"""
        # Make a mutable copy - handle both dict and QueryDict
        if hasattr(data, 'copy'):
            data = data.copy()
        elif hasattr(data, 'dict'):
            data = data.dict()
        else:
            data = dict(data)
        
        # If 'date' is provided, ensure 'expense_date' is also set for validation
        # The 'date' field with source='expense_date' should handle this, but we ensure it here too
        if 'date' in data and 'expense_date' not in data:
            data['expense_date'] = data['date']
        
        # Handle integer IDs - try to convert them to UUIDs by looking up objects
        # Currency: if integer, try to get by index or use default
        if 'currency' in data:
            currency_value = data['currency']
            if isinstance(currency_value, (int, float)) or (isinstance(currency_value, str) and currency_value.isdigit()):
                try:
                    from apps.core.models import Currency
                    currencies = list(Currency.objects.filter(is_active=True).order_by('code'))
                    idx = int(currency_value) - 1  # Convert 1-based to 0-based index
                    if 0 <= idx < len(currencies):
                        data['currency'] = str(currencies[idx].id)
                    else:
                        # Use default USD or first available
                        default = Currency.objects.filter(code='USD', is_active=True).first()
                        if default:
                            data['currency'] = str(default.id)
                        elif currencies:
                            data['currency'] = str(currencies[0].id)
                        else:
                            # No currencies available - will fail validation with clear message
                            data['currency'] = None
                except (IndexError, AttributeError, ValueError, TypeError) as e:
                    # If lookup fails, try to use default
                    try:
                        from apps.core.models import Currency
                        default = Currency.objects.filter(code='USD', is_active=True).first()
                        if default:
                            data['currency'] = str(default.id)
                        else:
                            data['currency'] = str(Currency.objects.filter(is_active=True).first().id) if Currency.objects.filter(is_active=True).exists() else None
                    except:
                        data['currency'] = None
        
        # Category: if integer, try to get by index
        if 'category_id' in data:
            category_value = data['category_id']
            # Handle None, empty string, or falsy values - set to None to allow clearing
            if not category_value or (isinstance(category_value, str) and not category_value.strip()):
                data['category_id'] = None
            # Handle both integer and string numeric values (legacy support)
            elif isinstance(category_value, (int, float)) or (isinstance(category_value, str) and str(category_value).strip().isdigit()):
                try:
                    from apps.core.models import Category
                    categories = list(Category.objects.all().order_by('name'))
                    idx = int(category_value) - 1  # Convert 1-based to 0-based index
                    if categories and 0 <= idx < len(categories):
                        data['category_id'] = str(categories[idx].id)
                    elif categories:
                        # Index out of range - remove category_id (it's optional)
                        data['category_id'] = None
                    else:
                        # No categories available - remove category_id
                        data['category_id'] = None
                except (IndexError, AttributeError, ValueError, TypeError) as e:
                    # If lookup fails, remove category_id (it's optional)
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.warning(f"Failed to convert category_id {category_value}: {e}")
                    data['category_id'] = None
            # If it's already a UUID string, keep it as is (no conversion needed)
            # The serializer field will validate it's a valid UUID
        
        # Group: if string '1' or integer, try to get by index
        if 'group' in data:
            group_value = data['group']
            if isinstance(group_value, (int, float)) or (isinstance(group_value, str) and group_value.isdigit()):
                try:
                    from apps.groups.models import Group
                    # Get user's groups
                    from django.contrib.auth import get_user_model
                    User = get_user_model()
                    request = self.context.get('request')
                    if request and request.user:
                        groups = list(Group.objects.filter(
                            memberships__user=request.user,
                            memberships__is_active=True
                        ).distinct().order_by('name'))
                        idx = int(group_value) - 1
                        if 0 <= idx < len(groups):
                            data['group'] = str(groups[idx].id)
                        else:
                            data.pop('group', None)
                    else:
                        data.pop('group', None)
                except (IndexError, AttributeError, ValueError):
                    data.pop('group', None)
        
        # Handle shares_data user_ids - convert integer user IDs
        if 'shares_data' in data:
            if isinstance(data['shares_data'], str):
                import json
                try:
                    data['shares_data'] = json.loads(data['shares_data'])
                except json.JSONDecodeError:
                    pass
            if isinstance(data['shares_data'], list):
                for share in data['shares_data']:
                    if 'user_id' in share:
                        value = share['user_id']
                        if isinstance(value, (int, float)) or (isinstance(value, str) and value.isdigit()):
                            # Try to get user by index (not recommended, but handle it)
                            try:
                                from django.contrib.auth import get_user_model
                                User = get_user_model()
                                users = list(User.objects.all().order_by('id'))
                                idx = int(value) - 1
                                if 0 <= idx < len(users):
                                    share['user_id'] = str(users[idx].id)
                                else:
                                    # Remove invalid user_id
                                    share.pop('user_id', None)
                            except (IndexError, AttributeError, ValueError):
                                share.pop('user_id', None)
        
        return super().to_internal_value(data)
    
    def get_created_by(self, obj):
        """Return paid_by as created_by for backward compatibility"""
        return UserSimpleSerializer(obj.paid_by).data
    
    def get_comments_count(self, obj):
        return obj.comments.count()
    
    def get_total_shares(self, obj):
        return obj.shares.count()
    
    def to_representation(self, instance):
        """Convert Decimal fields to float for JSON serialization"""
        ret = super().to_representation(instance)
        # Convert Decimal amount to float
        if 'amount' in ret and ret['amount'] is not None:
            ret['amount'] = float(ret['amount'])
        return ret
    
    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than 0")
        return value
    
    def validate(self, data):
        """Additional validation - conversion happens in to_internal_value and create methods"""
        # Don't validate UUID format here since we handle conversion in to_internal_value
        # The conversion will happen before this method is called
        return data
    
    def create(self, validated_data):
        # Extract nested data
        tag_ids = validated_data.pop('tag_ids', [])
        shares_data = validated_data.pop('shares_data', [])
        category_id = validated_data.pop('category_id', None)
        
        # Ensure expense_date is set - check both 'date' and 'expense_date'
        if 'expense_date' not in validated_data:
            if 'date' in validated_data:
                validated_data['expense_date'] = validated_data.pop('date')
            else:
                from django.utils import timezone
                validated_data['expense_date'] = timezone.now().date()
        
        # Set category if provided
        if category_id:
            try:
                # category_id should be a UUID string after to_internal_value conversion
                # But handle both UUID string and integer (fallback in case conversion didn't work)
                if isinstance(category_id, (int, float)) or (isinstance(category_id, str) and str(category_id).strip().isdigit()):
                    # Still an integer or numeric string - try to convert by index (fallback)
                    from apps.core.models import Category
                    categories = list(Category.objects.all().order_by('name'))
                    idx = int(category_id) - 1
                    if categories and 0 <= idx < len(categories):
                        validated_data['category'] = categories[idx]
                    # If index is invalid, category is optional so just skip it
                else:
                    # Should be a UUID string - try to get the category
                    try:
                        validated_data['category'] = Category.objects.get(id=category_id)
                    except (Category.DoesNotExist, ValueError):
                        # Invalid UUID or category doesn't exist - category is optional, skip it
                        pass
            except (ValueError, TypeError, IndexError, AttributeError):
                # Category is optional, so if lookup fails, just skip it
                pass
        
        # Ensure currency is set (required field)
        # If currency is provided as UUID string, convert it
        currency_value = validated_data.get('currency')
        if currency_value and isinstance(currency_value, str) and currency_value.strip():
            # Only try to get currency if it's a non-empty string
            from apps.core.models import Currency
            try:
                validated_data['currency'] = Currency.objects.get(id=currency_value)
            except (Currency.DoesNotExist, ValueError):
                # Fallback to default currency if UUID is invalid or currency doesn't exist
                default_currency = Currency.objects.filter(code='USD').first() or Currency.objects.first()
                if default_currency:
                    validated_data['currency'] = default_currency
                else:
                    raise serializers.ValidationError("Currency is required and no default currency found")
        elif not currency_value or (isinstance(currency_value, str) and not currency_value.strip()):
            # Currency is missing, None, or empty string - use default
            from apps.core.models import Currency
            # Get default currency (USD) or first available
            default_currency = Currency.objects.filter(code='USD').first() or Currency.objects.first()
            if default_currency:
                validated_data['currency'] = default_currency
            else:
                raise serializers.ValidationError("Currency is required and no default currency found. Please run: python manage.py seed_currencies")
        
        # Ensure JSON fields have default values if not provided (required by model validation)
        # These fields cannot be blank, so we always set them to empty dict/list if not provided
        validated_data.setdefault('split_data', {})
        validated_data.setdefault('attachments', [])
        validated_data.setdefault('ocr_data', {})
        
        # Ensure they're not None (convert None to defaults)
        if validated_data.get('split_data') is None:
            validated_data['split_data'] = {}
        if validated_data.get('attachments') is None:
            validated_data['attachments'] = []
        if validated_data.get('ocr_data') is None:
            validated_data['ocr_data'] = {}
        
        # Set expense_type based on whether group is provided
        if validated_data.get('group'):
            validated_data['expense_type'] = 'group'
        else:
            validated_data['expense_type'] = 'personal'
        
        # Create expense (expense_date should already be set from to_internal_value or create method)
        # Use _skip_share_creation to prevent model's save() from auto-creating shares
        expense = Expense.objects.create(**validated_data)
        
        # Add tags
        if tag_ids:
            tags = Tag.objects.filter(id__in=tag_ids)
            expense.tags.set(tags)
        
        # Track user_ids to avoid duplicates (normalize to strings for comparison)
        seen_user_ids = set()
        
        # Create shares if provided
        if shares_data and len(shares_data) > 0:
            for share_data in shares_data:
                user_id = share_data.get('user_id')
                if user_id:
                    # Normalize user_id to string for comparison
                    user_id_str = str(user_id)
                    if user_id_str not in seen_user_ids:
                        seen_user_ids.add(user_id_str)
                        # Use get_or_create to avoid duplicate share errors
                        ExpenseShare.objects.get_or_create(
                            expense=expense,
                            user_id=user_id,
                            defaults={
                                'amount': share_data.get('amount', 0),
                                'currency': expense.currency,
                                'paid_by': expense.paid_by
                            }
                        )
        
        # If no shares_data and it's an individual expense, create share for payer
        # Only create if payer is not already in shares_data
        payer_id_str = str(expense.paid_by.id)
        if not expense.group and payer_id_str not in seen_user_ids:
            ExpenseShare.objects.get_or_create(
                expense=expense,
                user=expense.paid_by,
                defaults={
                    'amount': expense.amount,
                    'currency': expense.currency,
                    'paid_by': expense.paid_by
                }
            )
        # For group expenses without shares_data, let perform_create handle it via create_equal_shares
        
        return expense
    
    def update(self, instance, validated_data):
        # Extract nested data
        tag_ids = validated_data.pop('tag_ids', None)
        shares_data = validated_data.pop('shares_data', None)
        category_id = validated_data.pop('category_id', None)
        
        # Set expense_type based on whether group is provided
        if 'group' in validated_data:
            if validated_data.get('group'):
                validated_data['expense_type'] = 'group'
            else:
                validated_data['expense_type'] = 'personal'
        
        # Update category - handle both setting and clearing
        import logging
        logger = logging.getLogger(__name__)
        
        if category_id is not None:
            # category_id is explicitly provided (could be empty string to clear)
            logger.info(f"Updating expense category: category_id={category_id}, type={type(category_id)}")
            if category_id and str(category_id).strip():
                # Non-empty category_id - try to get the category
                try:
                    category = Category.objects.get(id=category_id)
                    validated_data['category'] = category
                    logger.info(f"Successfully set category to: {category.name} (id: {category.id})")
                except (Category.DoesNotExist, ValueError, TypeError) as e:
                    # Invalid category_id - log warning but don't fail (category is optional)
                    logger.warning(f"Invalid category_id {category_id} in update: {e}")
                    # Don't set category if lookup fails - keep existing or set to None
                    validated_data['category'] = None
            else:
                # Empty string or None - clear the category
                logger.info("Clearing category (category_id is empty or None)")
                validated_data['category'] = None
        else:
            # category_id not provided - don't change existing category
            logger.info("category_id not provided in update - keeping existing category")
        # If category_id is not in validated_data at all, don't change the existing category
        
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
                if share_data.get('user_id'):
                    ExpenseShare.objects.create(
                        expense=instance,
                        user_id=share_data.get('user_id'),
                        amount=share_data.get('amount', 0),
                        currency=instance.currency,
                        paid_by=instance.paid_by
                    )
        
        return instance


class RecurringExpenseSerializer(serializers.ModelSerializer):
    created_by = UserSimpleSerializer(read_only=True)
    paid_by = UserSimpleSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    category_id = serializers.UUIDField(write_only=True, required=False)
    group = serializers.PrimaryKeyRelatedField(
        queryset=Group.objects.all(),
        required=False,
        allow_null=True
    )
    currency = serializers.PrimaryKeyRelatedField(
        queryset=Currency.objects.all(),
        required=True
    )
    next_due_date = serializers.SerializerMethodField()
    
    class Meta:
        model = RecurringExpense
        fields = [
            'id', 'title', 'description', 'amount', 'currency', 'category',
            'category_id', 'group', 'frequency', 'start_date',
            'end_date', 'next_due_date', 'is_active', 'is_paused',
            'created_by', 'paid_by', 'split_type', 'split_data',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'created_by', 'next_due_date', 
            'created_at', 'updated_at'
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
        
        # Ensure currency is set
        currency_value = validated_data.get('currency')
        if currency_value and isinstance(currency_value, str) and currency_value.strip():
            # Only try to get currency if it's a non-empty string
            from apps.core.models import Currency
            try:
                validated_data['currency'] = Currency.objects.get(id=currency_value)
            except (Currency.DoesNotExist, ValueError):
                # Fallback to default currency if UUID is invalid or currency doesn't exist
                default_currency = Currency.objects.filter(code='USD').first() or Currency.objects.first()
                if default_currency:
                    validated_data['currency'] = default_currency
                else:
                    raise serializers.ValidationError("Currency is required and no default currency found. Please run: python manage.py seed_currencies")
        elif not currency_value or (isinstance(currency_value, str) and not currency_value.strip()):
            # Currency is missing, None, or empty string - use default
            from apps.core.models import Currency
            default_currency = Currency.objects.filter(code='USD').first() or Currency.objects.first()
            if default_currency:
                validated_data['currency'] = default_currency
            else:
                raise serializers.ValidationError("Currency is required and no default currency found. Please run: python manage.py seed_currencies")
        
        # Set created_by and paid_by from request user if not provided
        request = self.context.get('request')
        if request and request.user:
            if 'created_by' not in validated_data:
                validated_data['created_by'] = request.user
            if 'paid_by' not in validated_data:
                validated_data['paid_by'] = request.user
        
        # Set next_due_date to start_date if not provided
        if 'next_due_date' not in validated_data and 'start_date' in validated_data:
            validated_data['next_due_date'] = validated_data['start_date']
        
        return RecurringExpense.objects.create(**validated_data)
    
    def update(self, instance, validated_data):
        category_id = validated_data.pop('category_id', None)
        
        if category_id:
            validated_data['category'] = Category.objects.get(id=category_id)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        return instance
