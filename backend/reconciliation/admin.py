from django.contrib import admin
from .models import ReconciliationSession

@admin.register(ReconciliationSession)
class ReconciliationSessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'account', 'period_start', 'period_end', 'opening_balance', 'expected_balance', 'actual_balance', 'variance', 'status', 'created_at')
    list_filter = ('status', 'period_start', 'period_end', 'account__user')
    search_fields = ('account__name', 'account__user__username')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'closed_at')
