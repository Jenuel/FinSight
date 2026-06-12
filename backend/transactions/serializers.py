from rest_framework import serializers
from .models import Transaction
from accounts.models import CashAccount

class CashAccountMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = CashAccount
        fields = ['id', 'name', 'currency']

class TransactionSerializer(serializers.ModelSerializer):
    account_details = CashAccountMinimalSerializer(source='account', read_only=True)

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
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate_account(self, value):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            if value.user != request.user:
                raise serializers.ValidationError("You do not have permission to access this account.")
        else:
            if value.user is not None:
                raise serializers.ValidationError("This account requires authentication.")
        return value
