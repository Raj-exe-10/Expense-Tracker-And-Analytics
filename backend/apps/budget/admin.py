from django.contrib import admin
from .models import Wallet, WalletCategory, UserCategory, MonthlyBudget, WalletAllocation, WalletAdjustment


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'wallet_type', 'rollover_enabled', 'order')
    list_filter = ('wallet_type', 'rollover_enabled')
    search_fields = ('name', 'user__email')


@admin.register(WalletCategory)
class WalletCategoryAdmin(admin.ModelAdmin):
    list_display = ('category', 'wallet', 'get_user')
    list_filter = ('wallet',)

    def get_user(self, obj):
        return obj.wallet.user
    get_user.short_description = 'User'


@admin.register(UserCategory)
class UserCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'wallet', 'user')
    list_filter = ('wallet',)


@admin.register(MonthlyBudget)
class MonthlyBudgetAdmin(admin.ModelAdmin):
    list_display = ('user', 'year', 'month', 'total_amount', 'currency')
    list_filter = ('year', 'month')


@admin.register(WalletAllocation)
class WalletAllocationAdmin(admin.ModelAdmin):
    list_display = ('monthly_budget', 'wallet', 'amount', 'rollover_from_previous', 'accumulated_balance')
    list_filter = ('monthly_budget',)


@admin.register(WalletAdjustment)
class WalletAdjustmentAdmin(admin.ModelAdmin):
    list_display = ('monthly_budget', 'wallet', 'amount', 'note', 'created_at')
