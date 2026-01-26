"""
Management command to seed default currencies
"""
from django.core.management.base import BaseCommand
from apps.core.models import Currency


class Command(BaseCommand):
    help = 'Seed default currencies'

    def handle(self, *args, **options):
        default_currencies = [
            {'code': 'USD', 'name': 'US Dollar', 'symbol': '$', 'decimal_places': 2, 'exchange_rate_to_usd': 1.0, 'is_active': True},
            {'code': 'EUR', 'name': 'Euro', 'symbol': '€', 'decimal_places': 2, 'exchange_rate_to_usd': 0.92, 'is_active': True},
            {'code': 'GBP', 'name': 'British Pound', 'symbol': '£', 'decimal_places': 2, 'exchange_rate_to_usd': 0.79, 'is_active': True},
            {'code': 'JPY', 'name': 'Japanese Yen', 'symbol': '¥', 'decimal_places': 0, 'exchange_rate_to_usd': 149.0, 'is_active': True},
            {'code': 'INR', 'name': 'Indian Rupee', 'symbol': '₹', 'decimal_places': 2, 'exchange_rate_to_usd': 83.0, 'is_active': True},
            {'code': 'CAD', 'name': 'Canadian Dollar', 'symbol': 'C$', 'decimal_places': 2, 'exchange_rate_to_usd': 1.35, 'is_active': True},
            {'code': 'AUD', 'name': 'Australian Dollar', 'symbol': 'A$', 'decimal_places': 2, 'exchange_rate_to_usd': 1.52, 'is_active': True},
            {'code': 'CNY', 'name': 'Chinese Yuan', 'symbol': '¥', 'decimal_places': 2, 'exchange_rate_to_usd': 7.2, 'is_active': True},
            {'code': 'CHF', 'name': 'Swiss Franc', 'symbol': 'Fr', 'decimal_places': 2, 'exchange_rate_to_usd': 0.88, 'is_active': True},
            {'code': 'SGD', 'name': 'Singapore Dollar', 'symbol': 'S$', 'decimal_places': 2, 'exchange_rate_to_usd': 1.34, 'is_active': True},
        ]

        created_count = 0
        for curr_data in default_currencies:
            currency, created = Currency.objects.get_or_create(
                code=curr_data['code'],
                defaults={
                    'name': curr_data['name'],
                    'symbol': curr_data['symbol'],
                    'decimal_places': curr_data['decimal_places'],
                    'exchange_rate_to_usd': curr_data['exchange_rate_to_usd'],
                    'is_active': curr_data['is_active'],
                }
            )
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created currency: {currency.name} ({currency.code})')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Currency already exists: {currency.name} ({currency.code})')
                )

        self.stdout.write(
            self.style.SUCCESS(f'\nSuccessfully seeded {created_count} currencies')
        )
