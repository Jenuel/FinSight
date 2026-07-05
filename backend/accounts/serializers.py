from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Account

class UserMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class AccountSerializer(serializers.ModelSerializer):
    userid = serializers.CharField(source='user_id', read_only=True)
    
    class Meta:
        model = Account
        fields = [
            'id', 
            'userid', 
            'name', 
            'balance', 
            'currency', 
            'account_type', 
            'color',
            'icon',
            'created_at', 
            'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
