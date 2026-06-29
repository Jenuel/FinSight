import uuid
from decimal import Decimal
from django.db import models, transaction
from django.core.validators import MinValueValidator
from django.utils import timezone
from accounts.models import Account


class Transaction(models.Model):
    TRANSACTION_TYPE_CHOICES = [
        ('income', 'Income'),
        ('expense', 'Expense'),
    ]

    ENTRY_TYPE_CHOICES = [
        ('exact', 'Exact'),
        ('estimated', 'Estimated'),
        ('manual', 'Manual'),
    ]

    RECONCILIATION_STATUS_CHOICES = [
        ('unreconciled', 'Unreconciled'),
        ('reconciled', 'Reconciled'),
        ('excluded', 'Excluded'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    account = models.ForeignKey(
        Account,
        on_delete=models.CASCADE,
        related_name='transactions'
    )
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPE_CHOICES)
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    category = models.CharField(max_length=100, default='Uncategorized')
    description = models.TextField(blank=True, null=True)
    transaction_date = models.DateField(default=timezone.localdate)

    # reconciliation fields
    entry_type = models.CharField(
        max_length=10, choices=ENTRY_TYPE_CHOICES, default='exact'
    )
    reconciliation_status = models.CharField(
        max_length=20, choices=RECONCILIATION_STATUS_CHOICES, default='unreconciled'
    )
    reconciliation_session = models.ForeignKey(
        'reconciliation.ReconciliationSession',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='transactions'
    )
    is_adjustment = models.BooleanField(default=False)
    is_backdated = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-transaction_date', '-created_at']

    def __str__(self):
        return f"{self.transaction_type.capitalize()}: {self.amount} ({self.category})"

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        amount_decimal = Decimal(str(self.amount))

        with transaction.atomic():
            if is_new:
                account = Account.objects.select_for_update().get(pk=self.account_id)
                if self.transaction_type == 'income':
                    account.balance += amount_decimal
                else:
                    account.balance -= amount_decimal
                account.save(update_fields=['balance', 'updated_at'])
                self.account = account
            else:
                old = Transaction.objects.get(pk=self.pk)
                old_amount = Decimal(str(old.amount))

                if old.account_id != self.account_id:
                    account_ids = sorted([old.account_id, self.account_id])
                    accounts_map = {
                        acc.id: acc
                        for acc in Account.objects.select_for_update().filter(id__in=account_ids)
                    }
                    old_account = accounts_map[old.account_id]
                    new_account = accounts_map[self.account_id]

                    if old.transaction_type == 'income':
                        old_account.balance -= old_amount
                    else:
                        old_account.balance += old_amount
                    old_account.save(update_fields=['balance', 'updated_at'])

                    if self.transaction_type == 'income':
                        new_account.balance += amount_decimal
                    else:
                        new_account.balance -= amount_decimal
                    new_account.save(update_fields=['balance', 'updated_at'])
                    self.account = new_account
                else:
                    account = Account.objects.select_for_update().get(pk=self.account_id)
                    if old.transaction_type == 'income':
                        account.balance -= old_amount
                    else:
                        account.balance += old_amount
                    if self.transaction_type == 'income':
                        account.balance += amount_decimal
                    else:
                        account.balance -= amount_decimal
                    account.save(update_fields=['balance', 'updated_at'])
                    self.account = account

            super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        amount_decimal = Decimal(str(self.amount))
        with transaction.atomic():
            account = Account.objects.select_for_update().get(pk=self.account_id)
            if self.transaction_type == 'income':
                account.balance -= amount_decimal
            else:
                account.balance += amount_decimal
            account.save(update_fields=['balance', 'updated_at'])
            super().delete(*args, **kwargs)