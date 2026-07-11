from django.core.management.base import BaseCommand
from apps.authentication.models import User


class Command(BaseCommand):
    help = 'Create test users for development'

    def handle(self, *args, **options):
        test_users = [
            {
                'email': 'alice@test.com',
                'first_name': 'Alice',
                'last_name': 'Johnson',
                'password': 'Test@123',
                'role': 'enterprise_admin',
            },
            {'email': 'bob@test.com', 'first_name': 'Bob', 'last_name': 'Smith', 'password': 'Test@123'},
            {'email': 'charlie@test.com', 'first_name': 'Charlie', 'last_name': 'Brown', 'password': 'Test@123'},
        ]

        for u in test_users:
            user, created = User.objects.get_or_create(
                email=u['email'],
                defaults={
                    'username': u['email'].split('@')[0],
                    'first_name': u['first_name'],
                    'last_name': u['last_name'],
                    'is_active': True,
                    'role': u.get('role', 'user'),
                }
            )
            if created:
                user.set_password(u['password'])
                user.save()
            elif u.get('role') and user.role != u['role']:
                user.role = u['role']
                user.save(update_fields=['role'])
                self.stdout.write(self.style.SUCCESS(f"Created user: {u['email']}"))
            else:
                self.stdout.write(self.style.WARNING(f"User already exists: {u['email']}"))

        self.stdout.write(self.style.SUCCESS('\nTest users created successfully!'))
        self.stdout.write('\nLogin credentials:')
        self.stdout.write('  alice@test.com / Test@123')
        self.stdout.write('  bob@test.com / Test@123')
        self.stdout.write('  charlie@test.com / Test@123')
