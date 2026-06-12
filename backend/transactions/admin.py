from django.contrib import admin
from .models import Transaction

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'account', 'transaction_type', 'amount', 'category', 'transaction_date')
    list_filter = ('transaction_type', 'category', 'transaction_date', 'account__user')
    search_fields = ('category', 'description', 'account__name', 'account__user__username')
    ordering = ('-transaction_date', '-created_at')
    readonly_fields = ('created_at', 'updated_at')
