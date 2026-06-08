from django.contrib import admin
from .models import CashAccount

@admin.register(CashAccount)
class CashAccountAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'balance', 'currency', 'account_type')
    list_filter = ('account_type', 'user', 'currency')
    search_fields = ('name', 'user__username', 'user__email')
    ordering = ('user', 'name')
    readonly_fields = ('created_at', 'updated_at')
