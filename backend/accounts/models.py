import uuid
from decimal import Decimal
from django.db import models
from django.contrib.auth.models import User


class Account(models.Model):
    ACCOUNT_TYPE_CHOICES = [
        ('cash', 'Cash'),
        ('checking', 'Checking'),
        ('savings', 'Savings'),
        ('credit', 'Credit Card'),
        ('ewallet', 'E-Wallet'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='accounts',
        null=True,
        blank=True
    )
    name = models.CharField(max_length=100)
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    currency = models.CharField(max_length=3, default='PHP')
    account_type = models.CharField(
        max_length=20,
        choices=ACCOUNT_TYPE_CHOICES,
        default='cash'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.get_account_type_display()})"

    @property
    def is_liability(self):
        return self.account_type == 'credit'

    @property
    def verification_instruction(self):
        instructions = {
            'cash': 'Count your wallet.',
            'checking': 'Check your bank statement.',
            'savings': 'Check your bank statement.',
            'credit': 'Check your latest credit card statement.',
            'ewallet': f'Open your {self.name} app and check your balance.',
        }
        return instructions.get(self.account_type, 'Check your account balance.')