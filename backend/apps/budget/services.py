"""
Budget services: deduction, rollover, sinking fund, alerts.
"""
from django.db import models
from django.db.models import Sum
from django.utils import timezone
from decimal import Decimal
from datetime import date

from .models import (
    Wallet,
    WalletCategory,
    UserCategory,
    MonthlyBudget,
    WalletAllocation,
    WalletAdjustment,
)


def get_wallet_for_expense(expense):
    """
    Resolve the wallet for an expense from category or user_category.
    Returns (Wallet, WalletAllocation for expense month) or (None, None).
    Applies to both individual and group expenses: we use the payer's wallets
    and count the full amount the payer spent toward their budget.
    """
    if expense.paid_by_id is None:
        return None, None
    user = expense.paid_by
    wallet = None
    if expense.user_category_id:
        try:
            uc = UserCategory.objects.select_related('wallet').get(pk=expense.user_category_id)
            wallet = uc.wallet
        except UserCategory.DoesNotExist:
            pass
    elif expense.category_id:
        try:
            wc = WalletCategory.objects.filter(
                category_id=expense.category_id,
                wallet__user=user
            ).select_related('wallet').first()
            if wc:
                wallet = wc.wallet
        except Exception:
            pass
    if not wallet:
        return None, None
    year = expense.expense_date.year
    month = expense.expense_date.month
    try:
        budget = MonthlyBudget.objects.get(user=user, year=year, month=month)
        allocation = WalletAllocation.objects.filter(
            monthly_budget=budget,
            wallet=wallet
        ).first()
        return wallet, allocation
    except MonthlyBudget.DoesNotExist:
        return wallet, None


def get_spent_for_wallet_allocation(allocation, wallet, scope='personal'):
    """
    Sum of expenses in this month for this wallet (categories + user_categories in wallet).
    Scope determines what expenses are included:
    - 'personal': Individual expenses (paid_by=user) + User's share of group expenses.
    - 'group': Total amount of group expenses (where user is member) + Individual expenses. 
      (Actually prompt says 'Group Overview' = Total expenses for groups user is part of. 
       Usually implies IGNORING personal, but let's include personal if category matches? 
       Prompt says: "Show total expenses for groups... (ignoring personal share)." 
       It implies strictly Group Focus? Let's follow "Total Bill Amount In My Groups".)
       
       Wait, strictly "Group Overview" might mean ONLY group expenses.
       Prompt: "State 2: Group Overview... Data: Show total expenses for groups the user is part of... Logic: Sum(Total_Bill_Amount_In_My_Groups)"
       State 3: "All / Combined... Comprehensive list..."
       
       Let's implement:
       - 'personal': My individual expenses + My shares in group expenses.
       - 'group': Total bills of group expenses. (Excludes individual expenses? Maybe, if the goal is "Group Overview").
       - 'all': Personal + Group Total Bills.
    """
    from apps.expenses.models import Expense, ExpenseShare
    user = allocation.monthly_budget.user
    year = allocation.monthly_budget.year
    month = allocation.monthly_budget.month
    
    category_ids = list(
        WalletCategory.objects.filter(wallet=wallet).values_list('category_id', flat=True)
    )
    user_category_ids = list(
        UserCategory.objects.filter(wallet=wallet).values_list('id', flat=True)
    )
    
    # Base filters for time and deletion
    time_q = models.Q(
        expense_date__year=year,
        expense_date__month=month,
    )
    
    # Category filters
    cat_q = models.Q()
    if category_ids:
        cat_q |= models.Q(category_id__in=category_ids)
    if user_category_ids:
        cat_q |= models.Q(user_category_id__in=user_category_ids)
    
    if not cat_q:
        return Decimal('0')

    total_spent = Decimal('0')

    if scope == 'personal':
        # 1. Individual expenses paid by user
        individual_q = time_q & cat_q & models.Q(paid_by=user, group__isnull=True, is_deleted=False)
        individual_sum = Expense.objects.filter(individual_q).aggregate(s=Sum('amount'))['s'] or Decimal('0')
        
        # 2. My shares in group expenses
        # Filter shares where expense matches category/time
        share_q = models.Q(
            user=user, 
            expense__is_deleted=False,
            expense__expense_date__year=year,
            expense__expense_date__month=month
        )
        
        # Check expense categories via the share's expense
        share_cat_q = models.Q()
        if category_ids:
            share_cat_q |= models.Q(expense__category_id__in=category_ids)
        if user_category_ids:
            share_cat_q |= models.Q(expense__user_category_id__in=user_category_ids)
            
        share_sum = ExpenseShare.objects.filter(share_q & share_cat_q).aggregate(s=Sum('amount'))['s'] or Decimal('0')
        
        total_spent = individual_sum + share_sum

    elif scope == 'group':
        # Total bill amount of group expenses where user is a member
        # Logic: Expense has group, user is active member of group.
        # Note: Prompt says "Sum(Total_Bill_Amount_In_My_Groups)"
        
        group_base_q = time_q & cat_q & models.Q(group__memberships__user=user, group__memberships__is_active=True, is_deleted=False)
        total_spent = Expense.objects.filter(group_base_q).aggregate(s=Sum('amount'))['s'] or Decimal('0')

    elif scope == 'all':
        # Individual + Group Totals
        
        # Individual
        individual_q = time_q & cat_q & models.Q(paid_by=user, group__isnull=True, is_deleted=False)
        individual_sum = Expense.objects.filter(individual_q).aggregate(s=Sum('amount'))['s'] or Decimal('0')
        
        # Group Totals
        group_base_q = time_q & cat_q & models.Q(group__memberships__user=user, group__memberships__is_active=True, is_deleted=False)
        group_sum = Expense.objects.filter(group_base_q).aggregate(s=Sum('amount'))['s'] or Decimal('0')
        
        total_spent = individual_sum + group_sum
        
    return total_spent


def get_adjustments_total(allocation):
    """Sum of one-time adjustments for this allocation's budget+wallet."""
    return WalletAdjustment.objects.filter(
        monthly_budget=allocation.monthly_budget,
        wallet=allocation.wallet,
    ).aggregate(s=Sum('amount'))['s'] or Decimal('0')


def remaining_balance(allocation, scope='personal'):
    """
    Remaining balance for this allocation.
    If scope is 'personal', uses the personal limit.
    If scope is 'group' or 'all', conceptually 'remaining' against a personal limit 
    is weird, but we will return (Limit - ScopeSpent) essentially showing 
    how much the group usage eats into the personal budget (or overflows it).
    
    Actually, for 'group' view, usually you strictly track spending. 
    But to maintain the UI bar contract, we return (Limit - Spent).
    """
    if not allocation:
        return Decimal('0')
    wallet = allocation.wallet
    spent = get_spent_for_wallet_allocation(allocation, wallet, scope=scope)
    adjustments = get_adjustments_total(allocation)
    
    if wallet.wallet_type == 'sinking_fund':
        # Contribution is added at start of month
        limit = allocation.accumulated_balance + adjustments
    else:
        # Regular
        limit = allocation.amount + allocation.rollover_from_previous + adjustments
        
    return limit - spent


def ensure_monthly_budget(user, year, month, currency):
    """Get or create MonthlyBudget for user/year/month."""
    budget, _ = MonthlyBudget.objects.get_or_create(
        user=user,
        year=year,
        month=month,
        defaults={'currency': currency, 'total_amount': Decimal('0')}
    )
    if budget.currency_id != currency.pk:
        budget.currency = currency
        budget.save(update_fields=['currency'])
    return budget


def ensure_sinking_contribution(allocation):
    """
    For sinking funds: add this month's contribution to accumulated_balance if not yet added.
    We track "contribution added for month" via a flag or by checking if we're in the same month.
    Simple approach: at first access in the month, add contribution to accumulated_balance.
    Use a small table or store in WalletAllocation. We'll add a field contributed_this_month
    to avoid double-adding. Actually we can just add the contribution when the allocation
    is created for the month (copy from previous month's accumulated_balance and add contribution).
    So when creating WalletAllocation for a new month for a sinking fund, set
    accumulated_balance = previous_allocation.accumulated_balance + amount (monthly contribution).
    That happens in "rollover / create next month" logic. So we don't need to "ensure" here
    on first access - we do it when creating the allocation. So this function can be:
    "when creating next month allocation for sinking fund, set accumulated_balance =
     prev.accumulated_balance + prev.amount (contribution)". So no separate ensure_sinking_contribution
    needed if we create allocations correctly. When do we create allocations? When user sets
    budget for a month and adds wallet limits. So for sinking fund the user sets "monthly
    contribution". When we create the allocation we set accumulated_balance = previous
    month's accumulated_balance + this month's amount (for new month). So we need to
    ensure when we "get or create" allocation for current month for a sinking fund wallet,
    we carry over previous balance + add contribution. I'll add a field to WalletAllocation:
    sinking_contribution_added (bool) so we only add contribution once per month. Or we
    just compute: for sinking, remaining = accumulated_balance + sum(adjustments) - spent.
    And we set accumulated_balance when we create next month's allocation (rollover logic).
    So when creating WalletAllocation for month M for sinking fund: get previous month
    allocation, accumulated_balance = prev.accumulated_balance + amount (this month's
    contribution). When no previous month, accumulated_balance = amount.
    So ensure_sinking_contribution is not needed as a separate step if we create
    allocations with correct accumulated_balance. For existing allocations we don't
    double-add. So I'll remove ensure_sinking_contribution from this service and
    handle it in the rollover/creation logic in views.
    """
    pass


def process_expense_deduction(expense):
    """
    After an individual expense is saved: no need to "deduct" explicitly because
    remaining_balance() is computed from sum(expenses). So we only need to:
    1. Check velocity and threshold alerts.
    2. Optionally invalidate caches.
    """
    wallet, allocation = get_wallet_for_expense(expense)
    if not allocation:
        return
    user = expense.paid_by
    check_wallet_alerts(user, allocation, expense.expense_date)


def process_expense_refund(expense):
    """After an expense is deleted: same as deduction - balances are computed from DB."""
    wallet, allocation = get_wallet_for_expense(expense)
    if not allocation:
        return
    user = expense.paid_by
    check_wallet_alerts(user, allocation, expense.expense_date)


def check_wallet_alerts(user, allocation, for_date):
    """
    Velocity: spent too much for day of month (e.g. 80% by day 10).
    Threshold: 50%, 90%, 100% utilization.
    """
    from apps.notifications.services import NotificationService
    wallet = allocation.wallet
    spent = get_spent_for_wallet_allocation(allocation, wallet)
    adjustments = get_adjustments_total(allocation)
    if wallet.wallet_type == 'sinking_fund':
        limit = allocation.accumulated_balance + adjustments
    else:
        limit = allocation.amount + allocation.rollover_from_previous + adjustments
    if limit <= 0:
        return
    utilization = (spent / limit * 100).quantize(Decimal('0.01'))
    day = for_date.day
    try:
        from calendar import monthrange
        days_in_month = monthrange(for_date.year, for_date.month)[1]
    except Exception:
        days_in_month = 30
    expected_ratio = day / days_in_month if days_in_month else 0
    # Velocity: e.g. spent 80% but only 33% of month elapsed
    if expected_ratio > 0 and utilization > 0:
        spending_ratio = float(utilization / 100)
        if spending_ratio >= 0.8 and expected_ratio < 0.5:
            NotificationService.create_notification(
                user=user,
                notification_type='budget_velocity_alert',
                title='Spending too fast',
                message=f'You have used {utilization}% of your "{wallet.name}" wallet but only {int(expected_ratio*100)}% of the month has passed.',
                priority='high',
                related_object_type='wallet',
                related_object_id=str(wallet.id),
                action_url='/budget',
                metadata={
                    'wallet_id': str(wallet.id),
                    'wallet_name': wallet.name,
                    'utilization': float(utilization),
                    'day': day,
                    'days_in_month': days_in_month,
                },
            )
    # Thresholds
    for pct, already_key in [(50, '50_sent'), (90, '90_sent'), (100, '100_sent')]:
        if utilization >= pct:
            # Avoid duplicate: check metadata on recent notification
            recent = getattr(check_wallet_alerts, '_threshold_sent', {}).get(
                (allocation.id, pct)
            )
            if recent == for_date:
                continue
            NotificationService.create_notification(
                user=user,
                notification_type='budget_threshold_alert',
                title=f'"{wallet.name}" wallet at {utilization}%',
                message=f'Your "{wallet.name}" budget has reached {utilization}% utilization ({spent:.2f} of {limit:.2f}).',
                priority='high' if pct >= 90 else 'normal',
                related_object_type='wallet',
                related_object_id=str(wallet.id),
                action_url='/budget',
                metadata={
                    'wallet_id': str(wallet.id),
                    'wallet_name': wallet.name,
                    'utilization': float(utilization),
                    'threshold': pct,
                    'spent': float(spent),
                    'limit': float(limit),
                },
            )
            if not hasattr(check_wallet_alerts, '_threshold_sent'):
                check_wallet_alerts._threshold_sent = {}
            check_wallet_alerts._threshold_sent[(allocation.id, pct)] = for_date


def apply_rollover(user, from_year, from_month, to_budget):
    """
    For each wallet with rollover_enabled, set to_budget's WalletAllocation
    rollover_from_previous = previous month's remaining balance.
    Creates allocations for to_budget if they don't exist (for wallets that had allocation last month).
    """
    try:
        from_budget = MonthlyBudget.objects.get(user=user, year=from_year, month=from_month)
    except MonthlyBudget.DoesNotExist:
        return
    for alloc in from_budget.wallet_allocations.select_related('wallet').all():
        if not alloc.wallet.rollover_enabled:
            continue
        rem = remaining_balance(alloc)
        if rem <= 0:
            continue
        wa, created = WalletAllocation.objects.get_or_create(
            monthly_budget=to_budget,
            wallet=alloc.wallet,
            defaults={
                'amount': alloc.amount,
                'rollover_from_previous': rem,
                'accumulated_balance': alloc.accumulated_balance if alloc.wallet.wallet_type == 'sinking_fund' else Decimal('0'),
            }
        )
        if not created:
            wa.rollover_from_previous = rem
            wa.save(update_fields=['rollover_from_previous'])
    # Sinking funds: for each sinking fund allocation in to_budget that we just created,
    # accumulated_balance = prev.accumulated_balance + this month's contribution (amount)
    for alloc in to_budget.wallet_allocations.select_related('wallet').filter(
        wallet__wallet_type='sinking_fund'
    ):
        prev = WalletAllocation.objects.filter(
            monthly_budget=from_budget,
            wallet=alloc.wallet,
        ).first()
        if prev:
            alloc.accumulated_balance = prev.accumulated_balance + alloc.amount
            alloc.save(update_fields=['accumulated_balance'])
