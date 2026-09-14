from decimal import Decimal

from django.urls import reverse
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from .models import Account


class AccountTests(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(username='user1', password='password123')
        self.user2 = User.objects.create_user(username='user2', password='password123')

        self.user1_account = Account.objects.create(
            name='User1 Checking',
            balance=Decimal('2500.50'),
            currency='USD',
            account_type='checking',
            user=self.user1
        )
        self.user2_account = Account.objects.create(
            name='User2 Savings',
            balance=Decimal('5000.00'),
            currency='EUR',
            account_type='savings',
            user=self.user2
        )

        self.list_create_url = reverse('account-list')

    # --- Authentication -----------------------------------------------------

    def test_list_accounts_unauthenticated_is_rejected(self):
        """Anonymous reads are refused outright - there is no public ledger."""
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_account_unauthenticated_is_rejected(self):
        """Anonymous writes are refused, and must not create an ownerless account."""
        data = {'name': 'Anon Cash', 'initial_balance': '50.00', 'account_type': 'cash'}
        response = self.client.post(self.list_create_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(Account.objects.filter(name='Anon Cash').exists())

    def test_retrieve_account_unauthenticated_is_rejected(self):
        url = reverse('account-detail', kwargs={'pk': self.user1_account.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # --- Ownership scoping --------------------------------------------------

    def test_list_accounts_returns_only_own_accounts(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'User1 Checking')

    def test_cannot_retrieve_other_users_account(self):
        """Another user's account is invisible, not merely forbidden (404, not 403)."""
        self.client.force_authenticate(user=self.user1)
        url = reverse('account-detail', kwargs={'pk': self.user2_account.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_cannot_update_other_users_account(self):
        self.client.force_authenticate(user=self.user1)
        url = reverse('account-detail', kwargs={'pk': self.user2_account.id})
        response = self.client.patch(url, {'name': 'Hijacked'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        self.user2_account.refresh_from_db()
        self.assertEqual(self.user2_account.name, 'User2 Savings')

    def test_cannot_delete_other_users_account(self):
        self.client.force_authenticate(user=self.user1)
        url = reverse('account-detail', kwargs={'pk': self.user2_account.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Account.objects.filter(id=self.user2_account.id).exists())

    # --- Create -------------------------------------------------------------

    def test_create_account_is_linked_to_requesting_user(self):
        self.client.force_authenticate(user=self.user1)
        data = {
            'name': 'User1 New Wallet',
            'initial_balance': '120.00',
            'currency': 'USD',
            'account_type': 'cash'
        }
        response = self.client.post(self.list_create_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['userid'], str(self.user1.id))

        account = Account.objects.get(id=response.data['id'])
        self.assertEqual(account.user, self.user1)
        self.assertEqual(account.balance, Decimal('120.00'))

    def test_create_account_defaults_to_zero_balance(self):
        self.client.force_authenticate(user=self.user1)
        data = {'name': 'Empty Wallet', 'account_type': 'cash'}
        response = self.client.post(self.list_create_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        account = Account.objects.get(id=response.data['id'])
        self.assertEqual(account.balance, Decimal('0.00'))

    def test_cannot_set_balance_directly_on_create(self):
        """`balance` is read-only: only `initial_balance` seeds an opening balance."""
        self.client.force_authenticate(user=self.user1)
        data = {'name': 'Sneaky Wallet', 'balance': '999999.00', 'account_type': 'cash'}
        response = self.client.post(self.list_create_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        account = Account.objects.get(id=response.data['id'])
        self.assertEqual(account.balance, Decimal('0.00'))

    # --- Balance is derived state, not client-writable -----------------------

    def test_update_account_cannot_change_balance(self):
        """
        The ledger invariant: balance moves only via Transaction.save()/delete().
        A client PATCHing it must be silently ignored, never honoured - otherwise
        the balance permanently desyncs from the transactions that back it.
        """
        self.client.force_authenticate(user=self.user1)
        url = reverse('account-detail', kwargs={'pk': self.user1_account.id})

        response = self.client.patch(url, {'balance': '999999.00'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.user1_account.refresh_from_db()
        self.assertEqual(self.user1_account.balance, Decimal('2500.50'))
        self.assertEqual(response.data['balance'], '2500.50')

    def test_update_account_metadata_still_works(self):
        """Locking balance must not lock the rest of the account."""
        self.client.force_authenticate(user=self.user1)
        url = reverse('account-detail', kwargs={'pk': self.user1_account.id})
        data = {'name': 'Renamed Checking', 'currency': 'USD', 'account_type': 'checking'}

        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Renamed Checking')

        self.user1_account.refresh_from_db()
        self.assertEqual(self.user1_account.name, 'Renamed Checking')
        self.assertEqual(self.user1_account.balance, Decimal('2500.50'))

    def test_initial_balance_is_ignored_on_update(self):
        self.client.force_authenticate(user=self.user1)
        url = reverse('account-detail', kwargs={'pk': self.user1_account.id})

        response = self.client.patch(url, {'initial_balance': '888.00'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.user1_account.refresh_from_db()
        self.assertEqual(self.user1_account.balance, Decimal('2500.50'))

    # --- Delete -------------------------------------------------------------

    def test_delete_own_account(self):
        self.client.force_authenticate(user=self.user1)
        url = reverse('account-detail', kwargs={'pk': self.user1_account.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Account.objects.filter(id=self.user1_account.id).exists())
