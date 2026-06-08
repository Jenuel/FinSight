from django.urls import reverse
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from .models import CashAccount

class CashAccountTests(APITestCase):
    def setUp(self):
        # Create test users
        self.user1 = User.objects.create_user(username='user1', password='password123')
        self.user2 = User.objects.create_user(username='user2', password='password123')
        
        # Create some test accounts
        self.public_account = CashAccount.objects.create(
            name='Public Wallet',
            balance=100.00,
            currency='USD',
            account_type='cash'
        )
        self.user1_account = CashAccount.objects.create(
            name='User1 Checking',
            balance=2500.50,
            currency='USD',
            account_type='checking',
            user=self.user1
        )
        self.user2_account = CashAccount.objects.create(
            name='User2 Savings',
            balance=5000.00,
            currency='EUR',
            account_type='savings',
            user=self.user2
        )
        
        self.list_create_url = reverse('cash-account-list')

    def test_list_accounts_unauthenticated(self):
        """
        Unauthenticated requests should only return accounts where user is null.
        """
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Public Wallet')

    def test_list_accounts_authenticated(self):
        """
        Authenticated requests should only return the logged-in user's accounts.
        """
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'User1 Checking')

    def test_create_account_unauthenticated(self):
        """
        Creating an account while unauthenticated should create it with user = null.
        """
        data = {
            'name': 'New Unauth Cash',
            'balance': '50.00',
            'currency': 'USD',
            'account_type': 'cash'
        }
        response = self.client.post(self.list_create_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(response.data['user'])
        
        # Verify in DB
        account = CashAccount.objects.get(id=response.data['id'])
        self.assertIsNone(account.user)

    def test_create_account_authenticated(self):
        """
        Creating an account while authenticated should link it to the user.
        """
        self.client.force_authenticate(user=self.user1)
        data = {
            'name': 'User1 New Wallet',
            'balance': '120.00',
            'currency': 'USD',
            'account_type': 'cash'
        }
        response = self.client.post(self.list_create_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['user']['username'], 'user1')
        
        # Verify in DB
        account = CashAccount.objects.get(id=response.data['id'])
        self.assertEqual(account.user, self.user1)

    def test_retrieve_account(self):
        """
        Can retrieve account details.
        """
        url = reverse('cash-account-detail', kwargs={'pk': self.public_account.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Public Wallet')

    def test_update_account(self):
        """
        Can update account details.
        """
        url = reverse('cash-account-detail', kwargs={'pk': self.public_account.id})
        data = {
            'name': 'Updated Public Wallet',
            'balance': '150.00',
            'currency': 'USD',
            'account_type': 'cash'
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Updated Public Wallet')
        self.assertEqual(response.data['balance'], '150.00')

    def test_delete_account(self):
        """
        Can delete an account.
        """
        url = reverse('cash-account-detail', kwargs={'pk': self.public_account.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(CashAccount.objects.filter(id=self.public_account.id).exists())

