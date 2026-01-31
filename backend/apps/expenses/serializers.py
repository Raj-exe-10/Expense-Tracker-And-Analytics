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


class GroupSimpleSerializer(serializers.ModelSerializer):
    """Simple group serializer for nested representations"""
    class Meta:
        model = Group
        fields = ['id', 'name', 'group_type', 'member_count']
        read_only_fields = fields


class CurrencySimpleSerializer(serializers.ModelSerializer):
    """Simple currency serializer for nested representations"""
    class Meta:
        model = Currency
        fields = ['id', 'code', 'name', 'symbol']
        read_only_fields = fields


class ExpenseSerializer(serializers.ModelSerializer):
    paid_by = UserSimpleSerializer(read_only=True)
    paid_by_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)  # Write field for paid_by
    created_by = serializers.SerializerMethodField()  # Alias for paid_by for backward compatibility
    category = CategorySerializer(read_only=True)
    category_id = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)
    # Read: return full group object, Write: accept group ID
    group = GroupSimpleSerializer(read_only=True)
    group_id = serializers.PrimaryKeyRelatedField(
        source='group',
        queryset=Group.objects.all(),
        required=False,
        allow_null=True,
        write_only=True
    )
    # Read: return full currency object, Write: accept currency ID  
    currency = CurrencySimpleSerializer(read_only=True)
    currency_id = serializers.PrimaryKeyRelatedField(
        source='currency',
        queryset=Currency.objects.all(),
        required=False,
        allow_null=True,
        write_only=True
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
    receipt_image = serializers.ImageField(source='receipt', required=False, allow_null=True, allow_empty_file=True)  # Alias for receipt
    
    class Meta:
        model = Expense
        fields = [
            'id', 'title', 'description', 'amount', 'currency', 'currency_id',
            'expense_date', 'date', 'category', 'category_id', 
            'group', 'group_id', 'paid_by', 'paid_by_id', 'created_by',
            'receipt', 'receipt_image', 'tags', 'tag_ids',
            'is_settled', 'shares', 'shares_data',
            'comments_count', 'total_shares', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 
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
        
        # Map 'currency' to 'currency_id' for backward compatibility
        if 'currency' in data and 'currency_id' not in data:
            data['currency_id'] = data.pop('currency')
        
        # Map 'group' to 'group_id' for backward compatibility  
        if 'group' in data and 'group_id' not in data:
            data['group_id'] = data.pop('group')
        
        # Helper function to extract ID from various formats (dict, string, etc.)
        def extract_id(value, field_name=''):
            import logging
            logger = logging.getLogger(__name__)
            
            if value is None:
                return None
            
            # If it's a dict, extract the 'id' key
            if isinstance(value, dict):
                logger.info(f"Extracting ID from dict for {field_name}: {value}")
                return value.get('id')
            
            # If it's a string that looks like a dict representation, try to parse it
            if isinstance(value, str):
                value = value.strip()
                # Check if it's a stringified dict like "{'id': '...', 'name': '...'}"
                if value.startswith('{') and value.endswith('}'):
                    try:
                        import ast
                        parsed = ast.literal_eval(value)
                        if isinstance(parsed, dict) and 'id' in parsed:
                            logger.info(f"Parsed stringified dict for {field_name}: {parsed['id']}")
                            return parsed['id']
                    except (ValueError, SyntaxError) as e:
                        logger.warning(f"Failed to parse stringified dict for {field_name}: {e}")
                        pass
                return value
            
            # Return as-is for numbers and other types
            return value
        
        # Extract IDs if values are objects
        if 'currency_id' in data:
            data['currency_id'] = extract_id(data['currency_id'], 'currency_id')
        if 'group_id' in data:
            data['group_id'] = extract_id(data['group_id'], 'group_id')
        
        # Handle currency_id - convert integer to Currency lookup
        if 'currency_id' in data:
            currency_value = data['currency_id']
            if isinstance(currency_value, (int, float)) or (isinstance(currency_value, str) and str(currency_value).isdigit()):
                try:
                    from apps.core.models import Currency
                    # Treat as actual ID, not index
                    currency_id = int(currency_value)
                    currency = Currency.objects.filter(id=currency_id, is_active=True).first()
                    if currency:
                        data['currency_id'] = currency.id
                    else:
                        # Use default USD or first available
                        default = Currency.objects.filter(code='USD', is_active=True).first()
                        if default:
                            data['currency_id'] = default.id
                        else:
                            first_currency = Currency.objects.filter(is_active=True).first()
                            data['currency_id'] = first_currency.id if first_currency else None
                except (ValueError, TypeError) as e:
                    # If lookup fails, try to use default
                    try:
                        from apps.core.models import Currency
                        default = Currency.objects.filter(code='USD', is_active=True).first()
                        if default:
                            data['currency_id'] = default.id
                        else:
                            first_currency = Currency.objects.filter(is_active=True).first()
                            data['currency_id'] = first_currency.id if first_currency else None
                    except:
                        data['currency_id'] = None
        
        # Category: handle numeric ID (integer primary key, not UUID)
        if 'category_id' in data:
            category_value = data['category_id']
            # Handle None, empty string, or falsy values - set to None to allow clearing
            if not category_value or (isinstance(category_value, str) and not category_value.strip()):
                data['category_id'] = None
            # Handle both integer and string numeric values - these are ACTUAL IDs, not indices
            elif isinstance(category_value, (int, float)) or (isinstance(category_value, str) and str(category_value).strip().isdigit()):
                try:
                    from apps.core.models import Category
                    import logging
                    logger = logging.getLogger(__name__)
                    
                    # Treat the value as actual database ID (not index)
                    category_id = int(category_value)
                    logger.info(f"Looking up category by ID: {category_id}")
                    
                    category = Category.objects.filter(id=category_id).first()
                    if category:
                        # Category uses integer primary key, so keep as integer
                        data['category_id'] = category_id
                        logger.info(f"Found category: {category.name} (id: {category.id})")
                    else:
                        # Category not found - log and set to None
                        logger.warning(f"Category with id={category_id} not found")
                        data['category_id'] = None
                except (ValueError, TypeError) as e:
                    # If conversion fails, set to None (category is optional)
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.warning(f"Failed to parse category_id {category_value}: {e}")
                    data['category_id'] = None
            # If it's already a string but not numeric, keep it as is
        
        # Group: validate group_id is a valid UUID (groups use UUID primary key)
        if 'group_id' in data:
            group_value = data['group_id']
            # Handle empty/null values
            if not group_value or (isinstance(group_value, str) and not group_value.strip()):
                data['group_id'] = None
            # Group uses UUID, so just validate the UUID is valid
            elif isinstance(group_value, str) and group_value.strip():
                # Keep the UUID string as-is, the serializer will validate it
                data['group_id'] = group_value.strip()
        
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
        
        # Set category if provided - category uses integer primary key
        if category_id is not None:
            try:
                from apps.core.models import Category
                import logging
                logger = logging.getLogger(__name__)
                
                # category_id should be an integer ID after to_internal_value conversion
                cat_id = int(category_id) if isinstance(category_id, (int, float, str)) and str(category_id).strip() else None
                
                if cat_id:
                    logger.info(f"Creating expense with category_id: {cat_id}")
                    category = Category.objects.filter(id=cat_id).first()
                    if category:
                        validated_data['category'] = category
                        logger.info(f"Set category to: {category.name}")
                    else:
                        logger.warning(f"Category with id={cat_id} not found during create")
            except (ValueError, TypeError) as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"Failed to set category from category_id={category_id}: {e}")
        
        # Ensure currency is set (required field)
        # The PrimaryKeyRelatedField with source='currency' should have already set this
        currency_value = validated_data.get('currency')
        if not currency_value:
            # Currency is missing - use default
            from apps.core.models import Currency
            default_currency = Currency.objects.filter(code='USD').first() or Currency.objects.first()
            if default_currency:
                validated_data['currency'] = default_currency
            else:
                raise serializers.ValidationError("Currency is required and no default currency found. Please run: python manage.py seed_currencies")
        
        # Handle paid_by_id - set the payer
        paid_by_id = validated_data.pop('paid_by_id', None)
        if paid_by_id:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                payer = User.objects.get(id=paid_by_id)
                validated_data['paid_by'] = payer
            except User.DoesNotExist:
                pass  # Will fall back to request user in perform_create
        
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
        paid_by_id = validated_data.pop('paid_by_id', None)
        
        # Handle paid_by_id - update the payer
        if paid_by_id is not None:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            import logging
            logger = logging.getLogger(__name__)
            try:
                payer = User.objects.get(id=paid_by_id)
                validated_data['paid_by'] = payer
                logger.info(f"Updated paid_by to: {payer.get_full_name()} (id: {payer.id})")
            except User.DoesNotExist:
                logger.warning(f"User with id={paid_by_id} not found for paid_by")
        
        # Set expense_type based on whether group is provided
        if 'group' in validated_data:
            if validated_data.get('group'):
                validated_data['expense_type'] = 'group'
            else:
                validated_data['expense_type'] = 'personal'
        
        # Update category - handle both setting and clearing (category uses integer primary key)
        import logging
        logger = logging.getLogger(__name__)
        
        if category_id is not None:
            # category_id is explicitly provided (could be empty string to clear)
            logger.info(f"Updating expense category: category_id={category_id}, type={type(category_id)}")
            if category_id and str(category_id).strip():
                # Non-empty category_id - try to get the category by integer ID
                try:
                    cat_id = int(category_id) if isinstance(category_id, (int, float, str)) else None
                    if cat_id:
                        category = Category.objects.filter(id=cat_id).first()
                        if category:
                            validated_data['category'] = category
                            logger.info(f"Successfully set category to: {category.name} (id: {category.id})")
                        else:
                            logger.warning(f"Category with id={cat_id} not found in update")
                            validated_data['category'] = None
                    else:
                        validated_data['category'] = None
                except (ValueError, TypeError) as e:
                    # Invalid category_id - log warning but don't fail (category is optional)
                    logger.warning(f"Invalid category_id {category_id} in update: {e}")
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
        elif paid_by_id is not None:
            # If paid_by changed but shares weren't provided, update existing shares' paid_by
            instance.shares.update(paid_by=instance.paid_by)
        
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
