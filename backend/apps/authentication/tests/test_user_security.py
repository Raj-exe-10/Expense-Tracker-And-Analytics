from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

User = get_user_model()


class UserViewSetSecurityTests(TestCase):
    def setUp(self):
        self.user_a = User.objects.create_user(
            username='usera',
            email='a@test.com',
            password='testpass123',
            first_name='A',
            last_name='User',
        )
        self.user_b = User.objects.create_user(
            username='userb',
            email='b@test.com',
            password='testpass123',
            first_name='B',
            last_name='User',
            role='user',
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user_a)

    def test_cannot_patch_other_user_role(self):
        response = self.client.patch(
            f'/api/auth/users/{self.user_b.id}/',
            {'role': 'enterprise_admin'},
            format='json',
        )
        self.assertIn(response.status_code, (403, 405))
        self.user_b.refresh_from_db()
        self.assertEqual(self.user_b.role, 'user')

    def test_cannot_delete_other_user(self):
        response = self.client.delete(f'/api/auth/users/{self.user_b.id}/')
        self.assertIn(response.status_code, (403, 405))
        self.assertTrue(User.objects.filter(id=self.user_b.id).exists())

    def test_unauthenticated_users_list_401(self):
        anon = APIClient()
        response = anon.get('/api/auth/users/')
        self.assertEqual(response.status_code, 401)

    def test_list_users_authenticated(self):
        response = self.client.get('/api/auth/users/')
        self.assertEqual(response.status_code, 200)

    def test_friendship_create_forces_pending(self):
        response = self.client.post(
            '/api/auth/friendships/',
            {'to_user_id': self.user_b.id, 'status': 'accepted', 'message': 'hi'},
            format='json',
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data.get('status'), 'pending')
