import uuid
from decimal import Decimal
from django.db import models, transaction
from django.core.validators import MinValueValidator
from django.utils import timezone
from accounts.models import CashAccount

class Transaction(models.Model):
    TRANSACTION_TYPE_CHOICES = [
        ('income', 'Income'),
        ('expense', 'Expense'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    account = models.ForeignKey(
        CashAccount,
        on_delete=models.CASCADE,
        related_name='transactions'
    )
    transaction_type = models.CharField(
        max_length=10,
        choices=TRANSACTION_TYPE_CHOICES
    )
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    category = models.CharField(
        max_length=100,
        default='Uncategorized'
    )
    description = models.TextField(
        blank=True,
        null=True
    )
    transaction_date = models.DateField(
        default=timezone.localdate
    )
    created_at = models.DateTimeField(
        auto_now_add=True
    )
    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        ordering = ['-transaction_date', '-created_at']

    def __str__(self):
        return f"{self.transaction_type.capitalize()}: {self.amount} ({self.category}) via {self.account.name}"

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        amount_decimal = Decimal(str(self.amount))
        with transaction.atomic():
            if is_new:
                # Lock and update account balance
                account = CashAccount.objects.select_for_update().get(pk=self.account_id)
                if self.transaction_type == 'income':
                    account.balance += amount_decimal
                else:
                    account.balance -= amount_decimal
                account.save(update_fields=['balance'])
                self.account = account
            else:
                old_instance = Transaction.objects.get(pk=self.pk)
                old_amount_decimal = Decimal(str(old_instance.amount))
                
                if old_instance.account_id != self.account_id:
                    # Lock both accounts in consistent order to prevent deadlocks
                    account_ids = sorted([old_instance.account_id, self.account_id])
                    accounts_map = {
                        acc.id: acc 
                        for acc in CashAccount.objects.select_for_update().filter(id__in=account_ids)
                    }
                    
                    old_account = accounts_map[old_instance.account_id]
                    new_account = accounts_map[self.account_id]
                    
                    # Revert old effect
                    if old_instance.transaction_type == 'income':
                        old_account.balance -= old_amount_decimal
                    else:
                        old_account.balance += old_amount_decimal
                    old_account.save(update_fields=['balance'])
                    
                    # Apply new effect
                    if self.transaction_type == 'income':
                        new_account.balance += amount_decimal
                    else:
                        new_account.balance -= amount_decimal
                    new_account.save(update_fields=['balance'])
                    self.account = new_account
                else:
                    # Lock single account
                    account = CashAccount.objects.select_for_update().get(pk=self.account_id)
                    # Revert old effect
                    if old_instance.transaction_type == 'income':
                        account.balance -= old_amount_decimal
                    else:
                        account.balance += old_amount_decimal
                    # Apply new effect
                    if self.transaction_type == 'income':
                        account.balance += amount_decimal
                    else:
                        account.balance -= amount_decimal
                    account.save(update_fields=['balance'])
                    self.account = account
            
            super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        amount_decimal = Decimal(str(self.amount))
        with transaction.atomic():
            account = CashAccount.objects.select_for_update().get(pk=self.account_id)
            if self.transaction_type == 'income':
                account.balance -= amount_decimal
            else:
                account.balance += amount_decimal
            account.save(update_fields=['balance'])
            super().delete(*args, **kwargs)
