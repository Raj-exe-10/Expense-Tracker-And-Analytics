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
        # Group filter (only when non-empty valid UUID - Group model uses UUID)
        group_id = request.query_params.get('group_id')
        if group_id is not None and str(group_id).strip():
            try:
                # Validate UUID format before filtering
                self.validate_uuid(str(group_id).strip(), 'group_id')
                queryset = queryset.filter(group_id=group_id)
            except ValidationError:
                # If not a valid UUID, skip the filter (don't crash)
                pass
        
        # Category filter (Category uses integer ID, not UUID)
        category_id = request.query_params.get('category_id')
        if category_id is not None and str(category_id).strip():
            try:
                cat_id = int(str(category_id).strip())
                queryset = queryset.filter(category_id=cat_id)
            except (ValueError, TypeError):
                # If not a valid integer, ignore the filter
                pass
        
        # Date range filters
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if start_date:
            validated_date = self.validate_date(start_date, 'start_date')
            queryset = queryset.filter(expense_date__gte=validated_date)
        
        if end_date:
            validated_date = self.validate_date(end_date, 'end_date')
            queryset = queryset.filter(expense_date__lte=validated_date)
        
        # Status filter (only apply when explicitly 'true' or 'false')
        is_settled = request.query_params.get('is_settled')
        if is_settled is not None and str(is_settled).strip() != '':
            queryset = queryset.filter(is_settled=str(is_settled).lower() == 'true')
        
        # Search filter (only when non-empty)
        search = request.query_params.get('search')
        if search is not None and str(search).strip():
            sanitized_search = self.sanitize_search(str(search).strip())
            if sanitized_search:
                queryset = queryset.filter(
                    Q(title__icontains=sanitized_search) |
                    Q(description__icontains=sanitized_search) |
                    Q(tags__name__icontains=sanitized_search)
                ).distinct()
        
        return queryset.order_by('-expense_date', '-created_at')
