from decimal import Decimal

from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Account

class UserMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class AccountSerializer(serializers.ModelSerializer):
    userid = serializers.CharField(source='user_id', read_only=True)

    # `balance` is DERIVED STATE, maintained exclusively by Transaction.save()/
    # delete() under select_for_update() (see transactions/models.py). Letting a
    # client write it would permanently desync the ledger from its transactions,
    # so it is read-only on both create and update. An opening balance is instead
    # supplied once, at creation, via `initial_balance`.
    balance = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    initial_balance = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        write_only=True,
        required=False,
        default=Decimal('0.00'),
        help_text='Opening balance. Accepted only on create; ignored on update.',
    )

    class Meta:
        model = Account
        fields = [
            'id',
            'userid',
            'name',
            'balance',
            'initial_balance',
            'currency',
            'account_type',
            'color',
            'icon',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['balance'] = validated_data.pop('initial_balance', Decimal('0.00'))
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Drop it rather than error: the field is meaningless post-creation, and a
        # client echoing back a full object shouldn't get a 400 for it.
        validated_data.pop('initial_balance', None)
        return super().update(instance, validated_data)
