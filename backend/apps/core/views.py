from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.core.cache import cache
from django.http import JsonResponse
from django.db import connection
from django.db.models import Q
from decimal import Decimal
import requests
from datetime import timedelta

from .models import Currency, Category, Tag, Country, SystemConfiguration
from .serializers import (
    CurrencySerializer, CategorySerializer, SimpleCategorySerializer,
    TagSerializer, CountrySerializer, SystemConfigurationSerializer,
    CurrencyExchangeRateSerializer
)


class HealthCheckView(APIView):
    """Health check endpoint"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        """Basic health check"""
        try:
            # Check database connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            
            # Check basic functionality
            user_count = request.user.__class__.objects.count() if request.user.is_authenticated else 0
            
            return Response({
                'status': 'healthy',
                'timestamp': timezone.now(),
                'database': 'connected',
                'user_count': user_count,
                'authenticated': request.user.is_authenticated
            })
        except Exception as e:
            return Response({
                'status': 'unhealthy',
                'error': str(e),
                'timestamp': timezone.now()
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)


class CurrencyViewSet(viewsets.ModelViewSet):
    """Currency management viewset"""
    queryset = Currency.objects.filter(is_active=True)
    serializer_class = CurrencySerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None  # Disable pagination for currencies list
    
    @method_decorator(cache_page(60 * 60))  # Cache for 1 hour
    def list(self, request, *args, **kwargs):
        """List currencies with caching"""
        cache_key = 'currencies_active'
        currencies = cache.get(cache_key)
        
        if currencies is None:
            currencies = list(
                Currency.objects.filter(is_active=True)
                .order_by('code')
                .values('id', 'code', 'name', 'symbol', 'decimal_places', 'exchange_rate_to_usd')
            )
            cache.set(cache_key, currencies, 60 * 60)  # Cache for 1 hour
        
        return Response(currencies)
    
    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Get popular currencies"""
        popular_currencies = self.queryset.filter(
            code__in=['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR']
        )
        serializer = self.get_serializer(popular_currencies, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def convert(self, request):
        """Convert between currencies"""
        serializer = CurrencyExchangeRateSerializer(data=request.data)
        
        if serializer.is_valid():
            from_currency_code = serializer.validated_data['from_currency']
            to_currency_code = serializer.validated_data['to_currency']
            amount = serializer.validated_data['amount']
            
            try:
                from_currency = Currency.objects.get(code=from_currency_code, is_active=True)
                to_currency = Currency.objects.get(code=to_currency_code, is_active=True)
                
                # Convert to USD first, then to target currency
                usd_amount = from_currency.convert_to_usd(amount)
                converted_amount = to_currency.convert_from_usd(usd_amount)
                
                # Calculate exchange rate
                exchange_rate = converted_amount / amount if amount > 0 else Decimal('0')
                
                return Response({
                    'from_currency': from_currency_code,
                    'to_currency': to_currency_code,
                    'amount': amount,
                    'converted_amount': converted_amount,
                    'exchange_rate': exchange_rate,
                    'last_updated': from_currency.updated_at
                })
            
            except Currency.DoesNotExist:
                return Response(
                    {'error': 'Currency not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CategoryViewSet(viewsets.ModelViewSet):
    """Category management viewset"""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None  # Disable pagination for categories list
    
    @method_decorator(cache_page(60 * 60 * 24))  # Cache for 24 hours
    def list(self, request, *args, **kwargs):
        """List categories with caching"""
        cache_key = 'categories_all'
        categories = cache.get(cache_key)
        
        if categories is None:
            categories = list(
                Category.objects.all()
                .order_by('name')
                .values('id', 'name', 'slug', 'icon', 'color', 'is_default')
            )
            cache.set(cache_key, categories, 60 * 60 * 24)  # Cache for 24 hours
        
        return Response(categories)
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by parent category
        parent_id = self.request.query_params.get('parent')
        if parent_id:
            queryset = queryset.filter(parent_id=parent_id)
        elif parent_id == 'null' or parent_id == '':
            queryset = queryset.filter(parent__isnull=True)
        
        # Filter by default categories
        is_default = self.request.query_params.get('is_default')
        if is_default:
            queryset = queryset.filter(is_default=is_default.lower() == 'true')
        
        return queryset.order_by('name')
    
    def get_serializer_class(self):
        if self.action == 'list' and self.request.query_params.get('simple'):
            return SimpleCategorySerializer
        return CategorySerializer
    
    @action(detail=False, methods=['get'])
    def tree(self, request):
        """Get category tree"""
        root_categories = Category.objects.filter(parent__isnull=True).order_by('name')
        serializer = CategorySerializer(root_categories, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def defaults(self, request):
        """Get default categories"""
        default_categories = Category.objects.filter(is_default=True).order_by('name')
        serializer = SimpleCategorySerializer(default_categories, many=True)
        return Response(serializer.data)


class TagViewSet(viewsets.ModelViewSet):
    """Tag management viewset"""
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Search functionality
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(name__icontains=search)
        
        return queryset.order_by('-usage_count', 'name')
    
    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Get popular tags"""
        popular_tags = self.queryset.filter(usage_count__gt=0)[:20]
        serializer = self.get_serializer(popular_tags, many=True)
        return Response(serializer.data)


class CountryViewSet(viewsets.ReadOnlyModelViewSet):
    """Country viewset (read-only)"""
    queryset = Country.objects.all()
    serializer_class = CountrySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Search by name or code
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(code__icontains=search)
            )
        
        return queryset.order_by('name')


class CurrencyRatesView(APIView):
    """Currency exchange rates endpoint"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get latest currency exchange rates"""
        try:
            # Get all active currencies
            currencies = Currency.objects.filter(is_active=True)
            
            rates_data = []
            for currency in currencies:
                rates_data.append({
                    'code': currency.code,
                    'name': currency.name,
                    'symbol': currency.symbol,
                    'rate_to_usd': str(currency.exchange_rate_to_usd),
                    'last_updated': currency.updated_at
                })
            
            return Response({
                'base_currency': 'USD',
                'rates': rates_data,
                'last_updated': timezone.now()
            })
        
        except Exception as e:
            return Response(
                {'error': 'Failed to fetch exchange rates'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def post(self, request):
        """Update currency exchange rates (admin only)"""
        if not request.user.is_staff:
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            # This would integrate with a real currency API
            # For now, we'll just update the timestamp
            updated_count = Currency.objects.filter(is_active=True).update(
                updated_at=timezone.now()
            )
            
            return Response({
                'message': f'Updated {updated_count} currency rates',
                'updated_at': timezone.now()
            })
        
        except Exception as e:
            return Response(
                {'error': 'Failed to update exchange rates'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
