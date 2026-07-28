from django.urls import reverse
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from accounts.models import Account
from .models import Transaction

class TransactionTests(APITestCase):
    def setUp(self):
        # Create test users
        self.user1 = User.objects.create_user(username='user1', password='password123')
        self.user2 = User.objects.create_user(username='user2', password='password123')

        # Every account must have an owner - there is no public/ownerless account.
        self.user1_account = Account.objects.create(
            name='User1 Checking',
            balance=1000.00,
            currency='USD',
            account_type='checking',
            user=self.user1
        )
        self.user1_savings = Account.objects.create(
            name='User1 Savings',
            balance=500.00,
            currency='USD',
            account_type='savings',
            user=self.user1
        )
        self.user2_account = Account.objects.create(
            name='User2 Savings',
            balance=2000.00,
            currency='USD',
            account_type='savings',
            user=self.user2
        )

        self.list_create_url = reverse('transaction-list')

    def test_list_transactions_unauthenticated_is_rejected(self):
        """Anonymous reads are refused - transactions are never publicly listable."""
        Transaction.objects.create(
            account=self.user1_account,
            transaction_type='income',
            amount=100.00,
            category='Salary'
        )

        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_transactions_authenticated(self):
        """
        Authenticated requests should only return transactions for the user's accounts.
        """
        # Create user1 transaction
        Transaction.objects.create(
            account=self.user1_account,
            transaction_type='income',
            amount=100.00,
            category='Salary'
        )
        # Create user2 transaction
        Transaction.objects.create(
            account=self.user2_account,
            transaction_type='income',
            amount=200.00,
            category='Bonus'
        )

        self.client.force_authenticate(user=self.user1)
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['category'], 'Salary')

    def test_create_transaction_unauthenticated_is_rejected(self):
        """
        Anonymous writes are refused and must not move any balance.
        """
        data = {
            'account': self.user1_account.id,
            'transaction_type': 'income',
            'amount': '50.00',
            'category': 'Gift'
        }
        response = self.client.post(self.list_create_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        self.user1_account.refresh_from_db()
        self.assertEqual(self.user1_account.balance, 1000.00)

    def test_create_income_transaction_authenticated(self):
        """
        Authenticated user can create income transaction, increasing account balance.
        """
        self.client.force_authenticate(user=self.user1)
        data = {
            'account': self.user1_account.id,
            'transaction_type': 'income',
            'amount': '150.00',
            'category': 'Salary'
        }
        # Start balance: 1000.00. Expect 1150.00
        response = self.client.post(self.list_create_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.user1_account.refresh_from_db()
        self.assertEqual(self.user1_account.balance, 1150.00)

    def test_create_expense_transaction_authenticated(self):
        """
        Authenticated user can create expense transaction, decreasing account balance.
        """
        self.client.force_authenticate(user=self.user1)
        data = {
            'account': self.user1_account.id,
            'transaction_type': 'expense',
            'amount': '50.00',
            'category': 'Rent'
        }
        # Start balance: 1000.00. Expect 950.00
        response = self.client.post(self.list_create_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.user1_account.refresh_from_db()
        self.assertEqual(self.user1_account.balance, 950.00)

    def test_create_transaction_on_other_user_account(self):
        """
        A user cannot create a transaction on another user's account.
        """
        self.client.force_authenticate(user=self.user1)
        data = {
            'account': self.user2_account.id,
            'transaction_type': 'income',
            'amount': '10.00',
            'category': 'Other'
        }
        response = self.client.post(self.list_create_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_transaction_invalid_amount(self):
        """
        Creating a transaction with a zero or negative amount should fail.
        """
        self.client.force_authenticate(user=self.user1)
        data = {
            'account': self.user1_account.id,
            'transaction_type': 'income',
            'amount': '-10.00',
            'category': 'Refund'
        }
        response = self.client.post(self.list_create_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_transaction_amount(self):
        """
        Updating a transaction's amount adjusts the associated account balance.
        """
        # Create an initial transaction (expense of 100.00)
        # account balance: 1000.00 -> 900.00
        tx = Transaction.objects.create(
            account=self.user1_account,
            transaction_type='expense',
            amount=100.00,
            category='Travel'
        )
        self.user1_account.refresh_from_db()
        self.assertEqual(self.user1_account.balance, 900.00)

        # Update the expense amount to 150.00
        # account balance should become: 1000.00 - 150.00 = 850.00
        self.client.force_authenticate(user=self.user1)
        url = reverse('transaction-detail', kwargs={'pk': tx.id})
        data = {
            'account': self.user1_account.id,
            'transaction_type': 'expense',
            'amount': '150.00',
            'category': 'Travel'
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.user1_account.refresh_from_db()
        self.assertEqual(self.user1_account.balance, 850.00)

    def test_update_transaction_type(self):
        """
        Updating transaction_type from expense to income adjusts account balance.
        """
        # Create expense of 100.00
        # account balance: 1000.00 -> 900.00
        tx = Transaction.objects.create(
            account=self.user1_account,
            transaction_type='expense',
            amount=100.00,
            category='Travel'
        )

        # Change transaction type to income of 100.00
        # Account balance should become: 1000.00 + 100.00 = 1100.00
        self.client.force_authenticate(user=self.user1)
        url = reverse('transaction-detail', kwargs={'pk': tx.id})
        data = {
            'account': self.user1_account.id,
            'transaction_type': 'income',
            'amount': '100.00',
            'category': 'Travel'
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.user1_account.refresh_from_db()
        self.assertEqual(self.user1_account.balance, 1100.00)

    def test_update_transaction_account(self):
        """
        Moving a transaction to a different account adjusts both account balances.
        """
        # Create expense of 100.00 on user1_account (1000.00 -> 900.00)
        # user1_savings starts at 500.00
        tx = Transaction.objects.create(
            account=self.user1_account,
            transaction_type='expense',
            amount=100.00,
            category='Utilities'
        )

        # Move the expense to user1_savings
        # user1_account should revert: 900.00 -> 1000.00
        # user1_savings should decrease: 500.00 -> 400.00
        self.client.force_authenticate(user=self.user1)
        url = reverse('transaction-detail', kwargs={'pk': tx.id})
        data = {
            'account': self.user1_savings.id,
            'transaction_type': 'expense',
            'amount': '100.00',
            'category': 'Utilities'
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.user1_account.refresh_from_db()
        self.user1_savings.refresh_from_db()
        self.assertEqual(self.user1_account.balance, 1000.00)
        self.assertEqual(self.user1_savings.balance, 400.00)

    def test_delete_transaction(self):
        """
        Deleting a transaction reverts its effect on the account balance.
        """
        # Create expense of 150.00 (1000.00 -> 850.00)
        tx = Transaction.objects.create(
            account=self.user1_account,
            transaction_type='expense',
            amount=150.00,
            category='Groceries'
        )
        self.user1_account.refresh_from_db()
        self.assertEqual(self.user1_account.balance, 850.00)

        # Delete transaction
        # balance should revert to 1000.00
        self.client.force_authenticate(user=self.user1)
        url = reverse('transaction-detail', kwargs={'pk': tx.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        self.user1_account.refresh_from_db()
        self.assertEqual(self.user1_account.balance, 1000.00)
