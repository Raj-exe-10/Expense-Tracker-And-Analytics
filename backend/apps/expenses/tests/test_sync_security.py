from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.core.models import Currency
from apps.expenses.models import Expense

User = get_user_model()


class SyncSecurityTests(TestCase):
    def setUp(self):
        self.currency = Currency.objects.create(
            code='USD', name='US Dollar', symbol='$', exchange_rate_to_usd=1
        )
        self.user_a = User.objects.create_user(
            username='synca',
            email='synca@test.com',
            password='testpass123',
            first_name='A',
            last_name='Sync',
        )
        self.user_b = User.objects.create_user(
            username='syncb',
            email='syncb@test.com',
            password='testpass123',
            first_name='B',
            last_name='Sync',
        )
        self.expense = Expense.objects.create(
            title='Secret',
            amount=Decimal('50.00'),
            currency=self.currency,
            expense_date='2026-01-15',
            paid_by=self.user_a,
            version=1,
        )
        self.client = APIClient()

    def test_sync_idor_denied(self):
        self.client.force_authenticate(user=self.user_b)
        response = self.client.post(
            '/api/expenses/sync/',
            {
                'items': [
                    {
                        'id': str(self.expense.id),
                        'base_version': 1,
                        'data': {'title': 'Hacked', 'amount': '999'},
                    }
                ]
            },
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data.get('applied'), [])
        conflicts = response.data.get('conflicts') or []
        self.assertTrue(any(c.get('reason') == 'not_found' for c in conflicts))
        self.expense.refresh_from_db()
        self.assertEqual(self.expense.title, 'Secret')

    def test_sync_owner_requires_base_version(self):
        self.client.force_authenticate(user=self.user_a)
        response = self.client.post(
            '/api/expenses/sync/',
            {
                'items': [
                    {
                        'id': str(self.expense.id),
                        'data': {'title': 'Updated'},
                    }
                ]
            },
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        conflicts = response.data.get('conflicts') or []
        self.assertTrue(any(c.get('reason') == 'base_version_required' for c in conflicts))

    def test_sync_owner_with_version_applies(self):
        self.client.force_authenticate(user=self.user_a)
        response = self.client.post(
            '/api/expenses/sync/',
            {
                'items': [
                    {
                        'id': str(self.expense.id),
                        'base_version': 1,
                        'data': {'title': 'Updated'},
                    }
                ]
            },
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn(str(self.expense.id), response.data.get('applied') or [])
        self.expense.refresh_from_db()
        self.assertEqual(self.expense.title, 'Updated')
        self.assertEqual(self.expense.version, 2)

    def test_resolve_conflict_idor(self):
        self.client.force_authenticate(user=self.user_b)
        response = self.client.post(
            '/api/expenses/sync/resolve/',
            {'id': str(self.expense.id), 'choice': 'local', 'data': {'title': 'Nope'}},
            format='json',
        )
        self.assertEqual(response.status_code, 404)

    def test_unauthenticated_sync_401(self):
        anon = APIClient()
        response = anon.post('/api/expenses/sync/', {'items': []}, format='json')
        self.assertEqual(response.status_code, 401)


class RecurringProcessAllTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='recuser',
            email='rec@test.com',
            password='testpass123',
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_process_all_forbidden_for_normal_user(self):
        response = self.client.post('/api/expenses/recurring/process_all/')
        self.assertEqual(response.status_code, 403)
