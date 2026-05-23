"""
Seed realistic expenses, budgets, and goals for post-game / ML analytics testing.

Usage:
    python manage.py seed_ml_analytics_data
    python manage.py seed_ml_analytics_data --email bob@test.com
    python manage.py seed_ml_analytics_data --clear --force
"""
from __future__ import annotations

import random
from calendar import monthrange
from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from apps.budget.models import (
    FixedCost,
    MonthlyBudget,
    SavingsGoal,
    Wallet,
    WalletAllocation,
    WalletCategory,
)
from apps.budget.services import ensure_monthly_budget
from apps.core.models import Category, Currency
from apps.expenses.models import Expense
from apps.groups.models import Group, GroupMembership

User = get_user_model()

DEMO_PREFIX = '[ML Demo]'
DEMO_GROUP_NAME = f'{DEMO_PREFIX} Roommatez'

WALLET_SETUP = [
    ('Food', 'food-dining', Decimal('450'), Decimal('75')),
    ('Transport', 'transportation', Decimal('220'), Decimal('30')),
    ('Shopping', 'shopping', Decimal('350'), Decimal('0')),
    ('Entertainment', 'entertainment', Decimal('180'), Decimal('20')),
]

EXPENSE_TEMPLATES = {
    'food-dining': [
        ('Groceries', 35, 95),
        ('Coffee shop', 4, 12),
        ('Lunch out', 12, 28),
        ('Takeout', 18, 45),
    ],
    'transportation': [
        ('Gas', 40, 70),
        ('Ride share', 8, 25),
        ('Parking', 5, 18),
    ],
    'shopping': [
        ('Household supplies', 15, 55),
        ('Clothing', 30, 120),
        ('Online order', 20, 85),
    ],
    'entertainment': [
        ('Streaming bundle', 12, 18),
        ('Movie night', 15, 45),
        ('Concert tickets', 40, 90),
    ],
    'bills-utilities': [
        ('Electric bill', 80, 140),
        ('Internet', 55, 75),
    ],
    'healthcare': [
        ('Pharmacy', 12, 45),
        ('Copay', 25, 60),
    ],
}


def _shift_month(year: int, month: int, delta: int) -> tuple[int, int]:
    m = month + delta
    y = year
    while m < 1:
        m += 12
        y -= 1
    while m > 12:
        m -= 12
        y += 1
    return y, m


def _random_day(year: int, month: int, rng: random.Random, max_day: int | None = None) -> date:
    last = max_day or monthrange(year, month)[1]
    return date(year, month, rng.randint(1, last))


class Command(BaseCommand):
    help = 'Seed mock expenses and budgets for ML / post-game analytics testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            default='alice@test.com',
            help='User email to attach demo data to (default: alice@test.com)',
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Remove previously seeded demo data for this user',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Re-seed even if demo data already exists',
        )

    def handle(self, *args, **options):
        email = options['email'].strip().lower()
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist as exc:
            raise CommandError(
                f'User {email} not found. Run: python manage.py create_test_users'
            ) from exc

        currency = Currency.objects.filter(code='USD').first()
        if not currency:
            raise CommandError('USD currency missing. Run: python manage.py seed_currencies')

        if options['clear']:
            self._clear_demo_data(user)
            self.stdout.write(self.style.WARNING(f'Cleared ML demo data for {email}'))
            if not options['force']:
                return

        if not options['force'] and Expense.objects.filter(
            paid_by=user, title__startswith=DEMO_PREFIX
        ).exists():
            self.stdout.write(
                self.style.WARNING(
                    f'Demo data already exists for {email}. '
                    'Use --force to re-seed or --clear to remove.'
                )
            )
            return

        with transaction.atomic():
            if options['force']:
                self._clear_demo_data(user)
            stats = self._seed(user, currency, random.Random(42))

        self.stdout.write(self.style.SUCCESS(f'\nML analytics demo data seeded for {email}'))
        self.stdout.write(f"  Personal expenses: {stats['personal_expenses']}")
        self.stdout.write(f"  Group expenses:    {stats['group_expenses']}")
        self.stdout.write(f"  Wallets:           {stats['wallets']}")
        self.stdout.write(f"  Savings goals:     {stats['savings_goals']}")
        self.stdout.write(f"  Monthly income:    ${user.monthly_income}")
        self.stdout.write('\nOpen Post-Game Analytics at /app/analytics/post-game')
        self.stdout.write('Try scopes: personal, group, and combined.')

    def _clear_demo_data(self, user):
        Expense.objects.filter(paid_by=user, title__startswith=DEMO_PREFIX).delete()
        SavingsGoal.objects.filter(user=user, name__startswith=DEMO_PREFIX).delete()
        FixedCost.objects.filter(user=user, name__startswith=DEMO_PREFIX).delete()
        Wallet.objects.filter(user=user, name__startswith=DEMO_PREFIX).delete()
        Group.objects.filter(name=DEMO_GROUP_NAME).delete()

    def _seed(self, user, currency, rng: random.Random) -> dict:
        today = timezone.now().date()
        cy, cm = today.year, today.month

        user.preferred_currency = user.preferred_currency or 'USD'
        user.monthly_income = Decimal('10000.00')
        user.save(update_fields=['preferred_currency', 'monthly_income'])

        categories = {
            c.slug: c for c in Category.objects.filter(
                slug__in=list({slug for _, slug, _, _ in WALLET_SETUP} | set(EXPENSE_TEMPLATES))
            )
        }
        missing = [slug for slug in {s for _, s, _, _ in WALLET_SETUP} if slug not in categories]
        if missing:
            raise CommandError(
                f'Missing categories: {missing}. Run: python manage.py seed_categories'
            )

        wallets = {}
        for order, (name, cat_slug, monthly_limit, rollover) in enumerate(WALLET_SETUP):
            wallet, _ = Wallet.objects.get_or_create(
                user=user,
                name=f'{DEMO_PREFIX} {name}',
                defaults={
                    'wallet_type': 'regular',
                    'rollover_enabled': rollover > 0,
                    'order': order,
                    'color': '#4CAF50',
                },
            )
            WalletCategory.objects.get_or_create(
                wallet=wallet,
                category=categories[cat_slug],
            )
            wallets[cat_slug] = wallet
            for y, m in (
                _shift_month(cy, cm, -2),
                _shift_month(cy, cm, -1),
                (cy, cm),
            ):
                mb = ensure_monthly_budget(user, y, m, currency)
                if mb.total_amount == 0:
                    mb.total_amount = Decimal('5000')
                    mb.save(update_fields=['total_amount'])
                WalletAllocation.objects.update_or_create(
                    monthly_budget=mb,
                    wallet=wallet,
                    defaults={
                        'amount': monthly_limit,
                        'rollover_from_previous': rollover if (y, m) == (cy, cm) else Decimal('0'),
                    },
                )

        SavingsGoal.objects.get_or_create(
            user=user,
            name=f'{DEMO_PREFIX} Emergency Fund',
            defaults={
                'target_amount': Decimal('5000'),
                'current_amount': Decimal('4100'),
                'currency': currency,
                'is_active': True,
            },
        )
        SavingsGoal.objects.get_or_create(
            user=user,
            name=f'{DEMO_PREFIX} Vacation',
            defaults={
                'target_amount': Decimal('2500'),
                'current_amount': Decimal('900'),
                'currency': currency,
                'is_active': True,
                'target_date': today + timedelta(days=120),
            },
        )

        due_day = min(28, max(1, today.day + 4))
        FixedCost.objects.get_or_create(
            user=user,
            name=f'{DEMO_PREFIX} Internet',
            defaults={
                'amount': Decimal('79.99'),
                'currency': currency,
                'due_day_of_month': due_day,
                'is_active': True,
            },
        )

        group, _ = Group.objects.get_or_create(
            name=DEMO_GROUP_NAME,
            defaults={
                'description': 'Shared apartment costs for ML analytics demos',
                'group_type': 'home',
                'currency': currency,
            },
        )
        bob = User.objects.filter(email='bob@test.com').first()
        for member, role in ((user, 'admin'), (bob, 'member') if bob else (None, None)):
            if not member:
                continue
            GroupMembership.objects.get_or_create(
                user=member,
                group=group,
                defaults={
                    'role': role,
                    'status': 'accepted',
                    'is_active': True,
                    'joined_at': timezone.now(),
                },
            )

        personal_count = 0
        group_count = 0

        month_scales = {
            _shift_month(cy, cm, -2): 0.55,
            _shift_month(cy, cm, -1): 0.72,
            (cy, cm): 1.0,
        }

        for (y, m), scale in month_scales.items():
            max_day = today.day if (y, m) == (cy, cm) else monthrange(y, m)[1]
            per_cat_counts = {
                'food-dining': int(10 * scale),
                'transportation': int(6 * scale),
                'shopping': int(5 * scale),
                'entertainment': int(4 * scale),
                'bills-utilities': 1 if m % 2 == 0 else 0,
                'healthcare': 1 if scale >= 0.7 else 0,
            }
            for cat_slug, count in per_cat_counts.items():
                cat = categories.get(cat_slug) or categories.get('food-dining')
                templates = EXPENSE_TEMPLATES.get(cat_slug, EXPENSE_TEMPLATES['food-dining'])
                for _ in range(count):
                    title, lo, hi = rng.choice(templates)
                    amount = Decimal(str(round(rng.uniform(lo, hi) * scale, 2)))
                    Expense.objects.create(
                        title=f'{DEMO_PREFIX} {title}',
                        amount=amount,
                        currency=currency,
                        category=cat,
                        expense_type='individual',
                        paid_by=user,
                        expense_date=_random_day(y, m, rng, max_day),
                    )
                    personal_count += 1

        # Large dining anomaly + extra food spend to push Food wallet over budget
        food_cat = categories['food-dining']
        Expense.objects.create(
            title=f'{DEMO_PREFIX} Anniversary dinner',
            amount=Decimal('285.00'),
            currency=currency,
            category=food_cat,
            expense_type='individual',
            paid_by=user,
            expense_date=today - timedelta(days=2),
        )
        personal_count += 1
        for _ in range(4):
            Expense.objects.create(
                title=f'{DEMO_PREFIX} Weekend brunch',
                amount=Decimal(str(round(rng.uniform(45, 75), 2))),
                currency=currency,
                category=food_cat,
                expense_type='individual',
                paid_by=user,
                expense_date=today - timedelta(days=rng.randint(1, 12)),
            )
            personal_count += 1

        if bob:
            group_templates = [
                ('Shared groceries', 60, 110),
                ('Utility split', 45, 90),
                ('House supplies', 25, 55),
            ]
            for title, lo, hi in group_templates:
                Expense.objects.create(
                    title=f'{DEMO_PREFIX} {title}',
                    amount=Decimal(str(round(rng.uniform(lo, hi), 2))),
                    currency=currency,
                    category=categories.get('food-dining'),
                    expense_type='group',
                    group=group,
                    paid_by=user,
                    expense_date=today - timedelta(days=rng.randint(1, 20)),
                )
                group_count += 1

        return {
            'personal_expenses': personal_count,
            'group_expenses': group_count,
            'wallets': len(wallets),
            'savings_goals': 2,
        }
