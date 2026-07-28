from rest_framework import serializers
from .models import Transaction
from accounts.models import Account

class AccountMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = ['id', 'name', 'currency']

class TransactionSerializer(serializers.ModelSerializer):
    account_details = AccountMinimalSerializer(source='account', read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id',
            'account',
            'account_details',
            'transaction_type',
            'amount',
            'category',
            'description',
            'transaction_date',
            'entry_type',
            'reconciliation_status',
            'reconciliation_session',
            'is_adjustment',
            'is_backdated',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate_account(self, value):
        # Prevents posting a transaction into someone else's account. The viewset's
        # get_queryset() scopes reads; this scopes writes.
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Authentication is required.")
        if value.user != request.user:
            raise serializers.ValidationError("You do not have permission to access this account.")
        return value
