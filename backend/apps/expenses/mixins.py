"""
Expense Filter Mixin
Provides reusable filtering logic for expense queries
"""
from django.db.models import Q
from rest_framework.exceptions import ValidationError
import uuid
from datetime import datetime
from .models import Expense


class ExpenseFilterMixin:
    """Mixin for common expense filtering logic"""
    
    def get_base_expense_queryset(self, user):
        """Get base queryset for user's expenses with optimizations"""
        return Expense.objects.filter(
            Q(paid_by=user) |
            Q(shares__user=user) |
            Q(group__memberships__user=user, group__memberships__is_active=True)
        ).select_related(
            'paid_by',
            'category',
            'currency',
            'group'
        ).prefetch_related(
            'shares__user',
            'tags',
            'comments__user'
        ).distinct()
    
    def validate_uuid(self, value, field_name):
        """Validate UUID format"""
        try:
            return uuid.UUID(str(value))
        except (ValueError, TypeError):
            raise ValidationError(f"Invalid {field_name} format. Must be a valid UUID.")
    
    def validate_date(self, value, field_name):
        """Validate date format"""
        try:
            return datetime.strptime(value, '%Y-%m-%d').date()
        except (ValueError, TypeError):
            raise ValidationError(f"Invalid {field_name} format. Use YYYY-MM-DD")
    
    def sanitize_search(self, search_term):
        """Sanitize search term to prevent SQL injection"""
        if not search_term:
            return ''
        # Remove potentially dangerous characters
        sanitized = search_term.replace("'", "''").replace(";", "").replace("--", "")
        return sanitized.strip()
    
    def apply_expense_filters(self, queryset, request):
        """Apply common filters to expense queryset"""
        # Group filter
        group_id = request.query_params.get('group_id')
        if group_id:
            self.validate_uuid(group_id, 'group_id')
            queryset = queryset.filter(group_id=group_id)
        
        # Category filter
        category_id = request.query_params.get('category_id')
        if category_id:
            self.validate_uuid(category_id, 'category_id')
            queryset = queryset.filter(category_id=category_id)
        
        # Date range filters
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if start_date:
            validated_date = self.validate_date(start_date, 'start_date')
            queryset = queryset.filter(expense_date__gte=validated_date)
        
        if end_date:
            validated_date = self.validate_date(end_date, 'end_date')
            queryset = queryset.filter(expense_date__lte=validated_date)
        
        # Status filter
        is_settled = request.query_params.get('is_settled')
        if is_settled is not None:
            queryset = queryset.filter(is_settled=is_settled.lower() == 'true')
        
        # Search filter
        search = request.query_params.get('search')
        if search:
            sanitized_search = self.sanitize_search(search)
            queryset = queryset.filter(
                Q(title__icontains=sanitized_search) |
                Q(description__icontains=sanitized_search) |
                Q(tags__name__icontains=sanitized_search)
            ).distinct()
        
        return queryset.order_by('-expense_date', '-created_at')
