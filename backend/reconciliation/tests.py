from decimal import Decimal
from django.urls import reverse
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from accounts.models import Account
from transactions.models import Transaction
from .models import ReconciliationSession

class ReconciliationTests(APITestCase):
    def setUp(self):
        # Create a test user
        self.user = User.objects.create_user(username='user1', password='password123')
        
        # Create a test account
        self.account = Account.objects.create(
            name='Checking Account',
            balance=Decimal('100.00'),
            currency='USD',
            account_type='checking',
            user=self.user
        )

    def test_reconciliation_close_no_variance(self):
        """
        Closing a session with no variance should not create an adjustment transaction
        and the account balance should remain the same.
        """
        # Create a transaction within the period
        Transaction.objects.create(
            account=self.account,
            transaction_type='income',
            amount=Decimal('50.00'),
            category='Salary',
            transaction_date=timezone.localdate()
        )
        self.account.refresh_from_db()
        self.assertEqual(self.account.balance, Decimal('150.00'))

        # Create the reconciliation session
        session = ReconciliationSession.objects.create(
            account=self.account,
            period_start=timezone.localdate() - timezone.timedelta(days=1),
            opening_balance=Decimal('100.00')
        )

        # Expected balance should be 100 + 50 = 150
        self.client.force_authenticate(user=self.user)
        url = reverse('reconciliation-close', kwargs={'pk': session.id})
        data = {'actual_balance': '150.00'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check session attributes
        session.refresh_from_db()
        self.assertEqual(session.status, 'closed')
        self.assertEqual(session.expected_balance, Decimal('150.00'))
        self.assertEqual(session.actual_balance, Decimal('150.00'))
        self.assertEqual(session.variance, Decimal('0.00'))

        # Check that no adjustment transaction was created
        self.assertFalse(Transaction.objects.filter(is_adjustment=True).exists())

        # Check account balance
        self.account.refresh_from_db()
        self.assertEqual(self.account.balance, Decimal('150.00'))

    def test_reconciliation_close_with_variance(self):
        """
        Closing a session with a variance should create an adjustment transaction
        and adjust the account balance correctly.
        """
        # Create the reconciliation session starting at 100.00
        session = ReconciliationSession.objects.create(
            account=self.account,
            period_start=timezone.localdate() - timezone.timedelta(days=1),
            opening_balance=Decimal('100.00')
        )

        # Expected balance is 100.00 (no transactions logged).
        # We specify actual balance is 120.00 (variance is +20.00).
        self.client.force_authenticate(user=self.user)
        url = reverse('reconciliation-close', kwargs={'pk': session.id})
        data = {'actual_balance': '120.00'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check session attributes
        session.refresh_from_db()
        self.assertEqual(session.status, 'closed')
        self.assertEqual(session.expected_balance, Decimal('100.00'))
        self.assertEqual(session.actual_balance, Decimal('120.00'))
        self.assertEqual(session.variance, Decimal('20.00'))

        # Check that an adjustment transaction was created
        adjustment = Transaction.objects.get(is_adjustment=True)
        self.assertEqual(adjustment.transaction_type, 'income')
        self.assertEqual(adjustment.amount, Decimal('20.00'))
        self.assertEqual(adjustment.category, 'Reconciliation Adjustment')

        # Check that the account balance is exactly 120.00 (no double-adjustment!)
        self.account.refresh_from_db()
        self.assertEqual(self.account.balance, Decimal('120.00'))

    def test_reconciliation_close_marks_pending_as_cleared(self):
        """
        Closing a session should bulk-update all 'pending' transactions inside the
        period to 'cleared'.  This is the invariant that was silently broken when
        migration 0006 replaced the status vocabulary without updating
        reconciliation/models.py.
        """
        today = timezone.localdate()
        period_start = today - timezone.timedelta(days=5)

        # Create two pending transactions inside the period
        tx1 = Transaction.objects.create(
            account=self.account,
            transaction_type='income',
            amount=Decimal('30.00'),
            category='Salary',
            transaction_date=period_start + timezone.timedelta(days=1),
            reconciliation_status='pending',
        )
        tx2 = Transaction.objects.create(
            account=self.account,
            transaction_type='expense',
            amount=Decimal('10.00'),
            category='Coffee',
            transaction_date=period_start + timezone.timedelta(days=2),
            reconciliation_status='pending',
        )
        self.account.refresh_from_db()
        # balance: 100 + 30 - 10 = 120

        session = ReconciliationSession.objects.create(
            account=self.account,
            period_start=period_start,
            opening_balance=Decimal('100.00'),
        )

        self.client.force_authenticate(user=self.user)
        url = reverse('reconciliation-close', kwargs={'pk': session.id})
        # actual matches expected (120) → no variance → no adjustment tx
        response = self.client.post(url, {'actual_balance': '120.00'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        tx1.refresh_from_db()
        tx2.refresh_from_db()
        self.assertEqual(tx1.reconciliation_status, 'cleared')
        self.assertEqual(tx2.reconciliation_status, 'cleared')

    def test_reconciliation_close_adjustment_has_adjusted_status(self):
        """
        The auto-generated adjustment transaction must carry
        reconciliation_status='adjusted' — not any other value.
        """
        session = ReconciliationSession.objects.create(
            account=self.account,
            period_start=timezone.localdate() - timezone.timedelta(days=1),
            opening_balance=Decimal('100.00'),
        )

        self.client.force_authenticate(user=self.user)
        url = reverse('reconciliation-close', kwargs={'pk': session.id})
        # variance = 130 - 100 = +30
        response = self.client.post(url, {'actual_balance': '130.00'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        adjustment = Transaction.objects.get(is_adjustment=True)
        self.assertEqual(adjustment.reconciliation_status, 'adjusted')
        self.assertEqual(adjustment.amount, Decimal('30.00'))
        self.assertEqual(adjustment.transaction_type, 'income')

