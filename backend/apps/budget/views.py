from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from decimal import Decimal

from .models import (
    Wallet,
    WalletCategory,
    UserCategory,
    MonthlyBudget,
    WalletAllocation,
    WalletAdjustment,
)
from .serializers import (
    WalletSerializer,
    WalletCategorySerializer,
    UserCategorySerializer,
    MonthlyBudgetSerializer,
    MonthlyBudgetWriteSerializer,
    WalletAllocationSerializer,
    WalletAllocationWriteSerializer,
    WalletAdjustmentSerializer,
)
from .services import (
    remaining_balance,
    get_spent_for_wallet_allocation,
    ensure_monthly_budget,
    apply_rollover,
)
from apps.core.models import Category, Currency


class WalletViewSet(viewsets.ModelViewSet):
    serializer_class = WalletSerializer
    permission_classes = [IsAuthenticated]
    queryset = Wallet.objects.none()

    def get_queryset(self):
        return Wallet.objects.filter(user=self.request.user).order_by('order', 'name')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class WalletCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = WalletCategorySerializer
    permission_classes = [IsAuthenticated]
    queryset = WalletCategory.objects.none()

    def get_queryset(self):
        qs = WalletCategory.objects.filter(
            wallet__user=self.request.user
        ).select_related('wallet', 'category')
        wallet_id = self.request.query_params.get('wallet')
        if wallet_id:
            qs = qs.filter(wallet_id=wallet_id)
        return qs

    def perform_create(self, serializer):
        serializer.save()


class UserCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = UserCategorySerializer
    permission_classes = [IsAuthenticated]
    queryset = UserCategory.objects.none()

    def get_queryset(self):
        return UserCategory.objects.filter(
            user=self.request.user
        ).select_related('wallet')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class MonthlyBudgetViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = MonthlyBudget.objects.none()

    def get_queryset(self):
        return MonthlyBudget.objects.filter(
            user=self.request.user
        ).prefetch_related('wallet_allocations__wallet').order_by('-year', '-month')

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return MonthlyBudgetWriteSerializer
        return MonthlyBudgetSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'], url_path='current')
    def current(self, request):
        """Get or create current month budget."""
        now = timezone.now()
        currency = Currency.objects.filter(code=request.user.preferred_currency).first()
        if not currency:
            currency = Currency.objects.filter(code='USD').first()
        if not currency:
            return Response(
                {'error': 'No currency available. Create USD in admin.'},
                status=status.HTTP_404_NOT_FOUND
            )
        budget = ensure_monthly_budget(
            request.user,
            now.year,
            now.month,
            currency,
        )
        serializer = self.get_serializer(budget)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='by-month')
    def by_month(self, request):
        """Get budget for year/month. Query params: year, month."""
        year = request.query_params.get('year', type=int)
        month = request.query_params.get('month', type=int)
        if not year or not month or month < 1 or month > 12:
            return Response(
                {'error': 'Query params year and month (1-12) required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        currency = Currency.objects.filter(code=request.user.preferred_currency).first() or Currency.objects.filter(code='USD').first()
        if not currency:
            return Response({'error': 'No currency.'}, status=status.HTTP_404_NOT_FOUND)
        budget = ensure_monthly_budget(request.user, year, month, currency)
        serializer = self.get_serializer(budget)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='apply-rollover')
    def apply_rollover_action(self, request, pk=None):
        """Apply rollover from this budget month to the next."""
        budget = self.get_object()
        if budget.month == 12:
            next_year, next_month = budget.year + 1, 1
        else:
            next_year, next_month = budget.year, budget.month + 1
        next_budget = ensure_monthly_budget(
            request.user,
            next_year,
            next_month,
            budget.currency,
        )
        apply_rollover(request.user, budget.year, budget.month, next_budget)
        serializer = self.get_serializer(next_budget)
        return Response(serializer.data)


class WalletAllocationViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = WalletAllocation.objects.none()

    def get_queryset(self):
        return WalletAllocation.objects.filter(
            monthly_budget__user=self.request.user
        ).select_related('monthly_budget', 'wallet')

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return WalletAllocationWriteSerializer
        return WalletAllocationSerializer

    def perform_create(self, serializer):
        allocation = serializer.save()
        # Sinking fund: set accumulated_balance from previous month + this month's contribution
        if allocation.wallet.wallet_type == 'sinking_fund' and allocation.amount > 0:
            prev_year = allocation.monthly_budget.year - 1 if allocation.monthly_budget.month == 1 else allocation.monthly_budget.year
            prev_month = 12 if allocation.monthly_budget.month == 1 else allocation.monthly_budget.month - 1
            prev = WalletAllocation.objects.filter(
                monthly_budget__user=allocation.monthly_budget.user,
                monthly_budget__year=prev_year,
                monthly_budget__month=prev_month,
                wallet=allocation.wallet,
            ).first()
            allocation.accumulated_balance = (prev.accumulated_balance if prev else Decimal('0')) + allocation.amount
            allocation.save(update_fields=['accumulated_balance'])


class WalletAdjustmentViewSet(viewsets.ModelViewSet):
    serializer_class = WalletAdjustmentSerializer
    permission_classes = [IsAuthenticated]
    queryset = WalletAdjustment.objects.none()

    def get_queryset(self):
        return WalletAdjustment.objects.filter(
            monthly_budget__user=self.request.user
        ).select_related('monthly_budget', 'wallet')

    def perform_create(self, serializer):
        serializer.save()


class BudgetCategoriesViewSet(viewsets.ViewSet):
    """Unified categories for budget: system categories + user categories, optionally by wallet."""
    permission_classes = [IsAuthenticated]

    def list(self, request):
        wallet_id = request.query_params.get('wallet_id')
        if wallet_id:
            # Categories assigned to this wallet (system) + user categories in this wallet
            from .models import WalletCategory
            system = list(
                WalletCategory.objects.filter(wallet_id=wallet_id)
                .values_list('category_id', flat=True)
            )
            from .models import UserCategory
            user_cats = UserCategory.objects.filter(
                wallet_id=wallet_id,
                user=request.user
            ).values('id', 'name', 'icon', 'color')
            categories_system = list(
                Category.objects.filter(id__in=system).values(
                    'id', 'name', 'slug', 'icon', 'color', 'is_default'
                )
            )
            return Response({
                'system_categories': categories_system,
                'user_categories': list(user_cats),
            })
        # All system categories (for assignment) and all user wallets
        categories = list(
            Category.objects.all().order_by('name').values(
                'id', 'name', 'slug', 'icon', 'color', 'is_default'
            )
        )
        wallets = list(
            Wallet.objects.filter(user=request.user).values('id', 'name', 'wallet_type')
        )
        return Response({
            'system_categories': categories,
            'wallets': wallets,
        })
