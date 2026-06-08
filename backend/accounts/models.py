import uuid
from django.db import models
from django.contrib.auth.models import User

class CashAccount(models.Model):
    ACCOUNT_TYPE_CHOICES = [
        ('cash', 'Cash'),
        ('checking', 'Checking'),
        ('savings', 'Savings'),
        ('credit', 'Credit Card'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='cash_accounts', 
        null=True, 
        blank=True
    )
    name = models.CharField(max_length=100)
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    currency = models.CharField(max_length=3, default='USD')
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
        return f"{self.name} ({self.currency} {self.balance})"

