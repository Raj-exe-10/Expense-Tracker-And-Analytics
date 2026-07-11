from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.core.models import Currency
from apps.expenses.models import Expense, ExpenseShare
from apps.payments.models import Settlement

User = get_user_model()


class SettlementIntegrityTests(TestCase):
    def setUp(self):
        self.currency = Currency.objects.create(
            code='USD', name='US Dollar', symbol='$', exchange_rate_to_usd=1
        )
        self.payer = User.objects.create_user(
            username='payer',
            email='payer@test.com',
            password='testpass123',
            first_name='Pay',
            last_name='Er',
        )
        self.payee = User.objects.create_user(
            username='payee',
            email='payee@test.com',
            password='testpass123',
            first_name='Pay',
            last_name='Ee',
        )
        self.expense1 = Expense.objects.create(
            title='E1',
            amount=Decimal('100.00'),
            currency=self.currency,
            expense_date='2026-01-10',
            paid_by=self.payer,
        )
        self.expense2 = Expense.objects.create(
            title='E2',
            amount=Decimal('50.00'),
            currency=self.currency,
            expense_date='2026-01-11',
            paid_by=self.payer,
        )
        self.share1 = ExpenseShare.objects.create(
            expense=self.expense1,
            user=self.payee,
            amount=Decimal('100.00'),
            currency=self.currency,
            paid_by=self.payer,
        )
        self.share2 = ExpenseShare.objects.create(
            expense=self.expense2,
            user=self.payee,
            amount=Decimal('50.00'),
            currency=self.currency,
            paid_by=self.payer,
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.payer)

    def test_quick_settle_without_group_settles_up_to_amount_only(self):
        response = self.client.post(
            '/api/payments/quick-settle/',
            {
                'payee_id': self.payee.id,
                'amount': '100.00',
                'complete_immediately': True,
            },
            format='json',
        )
        self.assertEqual(response.status_code, 201)
        self.share1.refresh_from_db()
        self.share2.refresh_from_db()
        # FIFO: first share (100) settled; second (50) left open
        self.assertTrue(self.share1.is_settled)
        self.assertFalse(self.share2.is_settled)

    def test_quick_settle_with_share_ids(self):
        response = self.client.post(
            '/api/payments/quick-settle/',
            {
                'payee_id': self.payee.id,
                'amount': '100.00',
                'complete_immediately': True,
                'settle_share_ids': [str(self.share1.id)],
            },
            format='json',
        )
        self.assertEqual(response.status_code, 201)
        self.share1.refresh_from_db()
        self.share2.refresh_from_db()
        self.assertTrue(self.share1.is_settled)
        self.assertFalse(self.share2.is_settled)

    def test_settlement_create_forces_payer(self):
        other = User.objects.create_user(
            username='other',
            email='other@test.com',
            password='testpass123',
        )
        response = self.client.post(
            '/api/payments/settlements/',
            {
                'payer_id': other.id,
                'payee_id': self.payee.id,
                'amount': '10.00',
                'currency': self.currency.id,
            },
            format='json',
        )
        self.assertEqual(response.status_code, 201)
        settlement = Settlement.objects.get(id=response.data['id'])
        self.assertEqual(settlement.payer_id, self.payer.id)
