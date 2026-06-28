import uuid
from decimal import Decimal
from django.db import models, transaction
from django.utils import timezone
from accounts.models import Account


class ReconciliationSession(models.Model):
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('closed', 'Closed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    account = models.ForeignKey(
        Account,
        on_delete=models.CASCADE,
        related_name='reconciliation_sessions'
    )
    period_start = models.DateField()
    period_end = models.DateField(null=True, blank=True)
    opening_balance = models.DecimalField(max_digits=12, decimal_places=2)
    expected_balance = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True
    )
    actual_balance = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True
    )
    variance = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True
    )
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='open')
    created_at = models.DateTimeField(auto_now_add=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.account.name} reconciliation ({self.period_start} to {self.period_end or 'open'})"

    def compute_expected_balance(self):
        from transactions.models import Transaction

        transactions = Transaction.objects.filter(
            account=self.account,
            transaction_date__range=(self.period_start, self.period_end or timezone.localdate()),
            is_adjustment=False,
            is_backdated=False,
        )

        total_income = transactions.filter(
            transaction_type='income'
        ).aggregate(
            total=models.Sum('amount')
        )['total'] or Decimal('0')

        total_expense = transactions.filter(
            transaction_type='expense'
        ).aggregate(
            total=models.Sum('amount')
        )['total'] or Decimal('0')

        return self.opening_balance + total_income - total_expense

    def close(self, actual_balance: Decimal):
        from transactions.models import Transaction

        with transaction.atomic():
            self.period_end = timezone.localdate()
            self.actual_balance = actual_balance
            self.expected_balance = self.compute_expected_balance()
            self.variance = actual_balance - self.expected_balance
            self.status = 'closed'
            self.closed_at = timezone.now()
            self.save()
            # log adjustment transaction if variance exists
            if self.variance != Decimal('0'):
                Transaction.objects.create(
                    account=self.account,
                    transaction_type='income' if self.variance > 0 else 'expense',
                    amount=abs(self.variance),
                    category='Reconciliation Adjustment',
                    description=f'Auto-adjustment from reconciliation session #{self.id}',
                    transaction_date=self.period_end,
                    entry_type='estimated',
                    reconciliation_session=self,
                    reconciliation_status='adjusted',
                    is_adjustment=True,
                )

            # mark all pending transactions in this period as cleared
            Transaction.objects.filter(
                account=self.account,
                transaction_date__range=(self.period_start, self.period_end),
                reconciliation_status='pending',
            ).update(reconciliation_status='cleared')