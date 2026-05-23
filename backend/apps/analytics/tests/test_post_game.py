from datetime import date
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.analytics.insight_rules import merge_insights
from apps.analytics.post_game_service import _compute_total_in
from apps.budget.models import MonthlyBudget, Wallet, WalletAllocation
from apps.core.models import Currency

User = get_user_model()


class PostGameAnalyticsTests(TestCase):
    def setUp(self):
        self.currency = Currency.objects.create(
            code='USD', name='US Dollar', symbol='$', exchange_rate_to_usd=1
        )
        self.user = User.objects.create_user(
            username='pguser',
            email='pg@test.com',
            password='testpass123',
            preferred_currency='USD',
            monthly_income=Decimal('5000'),
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_total_in_includes_income_and_rollover(self):
        wallet = Wallet.objects.create(user=self.user, name='Food')
        mb = MonthlyBudget.objects.create(
            user=self.user, year=2026, month=3, total_amount=5000, currency=self.currency
        )
        WalletAllocation.objects.create(
            monthly_budget=mb,
            wallet=wallet,
            amount=500,
            rollover_from_previous=Decimal('200'),
        )
        total, missing, rollover = _compute_total_in(self.user, 2026, 3)
        self.assertFalse(missing)
        self.assertEqual(rollover, 200.0)
        self.assertEqual(total, 5200.0)

    def test_merge_insights_dedupes(self):
        a = [{'id': '1', 'insight_key': 'k1', 'severity': 'low', 'type': 'info', 'title': 't', 'detail': 'd'}]
        b = [{'id': '2', 'insight_key': 'k1', 'severity': 'critical', 'type': 'warning', 'title': 't2', 'detail': 'd2'}]
        merged = merge_insights(a, b)
        self.assertEqual(len(merged), 1)

    def test_post_game_endpoint(self):
        response = self.client.get('/api/analytics/post-game/', {'year': 2026, 'month': 3, 'scope': 'personal'})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('meta', data)
        self.assertIn('insights', data)
        self.assertIn('cash_flow', data)
        self.assertEqual(data['meta']['scope'], 'personal')
