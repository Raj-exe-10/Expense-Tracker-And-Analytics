"""
Management command to seed default categories
"""
from django.core.management.base import BaseCommand
from apps.core.models import Category


class Command(BaseCommand):
    help = 'Seed default expense categories'

    def handle(self, *args, **options):
        default_categories = [
            {'name': 'Food & Dining', 'slug': 'food-dining', 'icon': 'restaurant', 'color': '#FF6B6B', 'is_default': True},
            {'name': 'Transportation', 'slug': 'transportation', 'icon': 'directions_car', 'color': '#4ECDC4', 'is_default': True},
            {'name': 'Shopping', 'slug': 'shopping', 'icon': 'shopping_bag', 'color': '#95E1D3', 'is_default': True},
            {'name': 'Entertainment', 'slug': 'entertainment', 'icon': 'movie', 'color': '#F38181', 'is_default': True},
            {'name': 'Bills & Utilities', 'slug': 'bills-utilities', 'icon': 'receipt', 'color': '#AA96DA', 'is_default': True},
            {'name': 'Healthcare', 'slug': 'healthcare', 'icon': 'local_hospital', 'color': '#FCBAD3', 'is_default': True},
            {'name': 'Education', 'slug': 'education', 'icon': 'school', 'color': '#FFD93D', 'is_default': True},
            {'name': 'Travel', 'slug': 'travel', 'icon': 'flight', 'color': '#6BCB77', 'is_default': True},
            {'name': 'Personal Care', 'slug': 'personal-care', 'icon': 'spa', 'color': '#FFD93D', 'is_default': True},
            {'name': 'Gifts & Donations', 'slug': 'gifts-donations', 'icon': 'card_giftcard', 'color': '#FF6B9D', 'is_default': True},
            {'name': 'Home & Garden', 'slug': 'home-garden', 'icon': 'home', 'color': '#C44569', 'is_default': True},
            {'name': 'Work & Business', 'slug': 'work-business', 'icon': 'business', 'color': '#4834D4', 'is_default': True},
            {'name': 'Other', 'slug': 'other', 'icon': 'more_horiz', 'color': '#95A5A6', 'is_default': True},
        ]

        created_count = 0
        for cat_data in default_categories:
            category, created = Category.objects.get_or_create(
                slug=cat_data['slug'],
                defaults={
                    'name': cat_data['name'],
                    'icon': cat_data['icon'],
                    'color': cat_data['color'],
                    'is_default': cat_data['is_default'],
                }
            )
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created category: {category.name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Category already exists: {category.name}')
                )

        self.stdout.write(
            self.style.SUCCESS(f'\nSuccessfully seeded {created_count} categories')
        )
