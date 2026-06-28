from rest_framework import serializers
from decimal import Decimal
from .models import ReconciliationSession
from accounts.models import Account
from transactions.serializers import AccountMinimalSerializer

class ReconciliationSessionSerializer(serializers.ModelSerializer):
    account_details = AccountMinimalSerializer(source='account', read_only=True)

    class Meta:
        model = ReconciliationSession
        fields = [
            'id',
            'account',
            'account_details',
            'period_start',
            'period_end',
            'opening_balance',
            'expected_balance',
            'actual_balance',
            'variance',
            'status',
            'created_at',
            'closed_at'
        ]
        read_only_fields = [
            'expected_balance',
            'actual_balance',
            'variance',
            'status',
            'created_at',
            'closed_at'
        ]

    def validate_account(self, value):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            if value.user != request.user:
                raise serializers.ValidationError("You do not have permission to access this account.")
        else:
            if value.user is not None:
                raise serializers.ValidationError("This account requires authentication.")
        return value


class ReconciliationCloseSerializer(serializers.Serializer):
    actual_balance = serializers.DecimalField(max_digits=12, decimal_places=2)
