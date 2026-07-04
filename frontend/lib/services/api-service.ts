import { Account, Transaction, FinanceState, DEFAULT_CATEGORIES } from '../types';
import { DataService } from './data-service';

export class ApiService implements DataService {
    private baseUrl: string;

    constructor() {
        this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
    }

    private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options?.headers,
        };

        const response = await fetch(url, { ...options, headers });
        
        if (!response.ok) {
            let errorMessage = `API Error: ${response.status} ${response.statusText}`;
            try {
                const errorData = await response.json();
                errorMessage = JSON.stringify(errorData);
            } catch (e) {}
            throw new Error(errorMessage);
        }

        if (response.status === 204) {
            return {} as T;
        }

        return response.json();
    }

    // --- Mappers ---
    // Backend returns snake_case, Frontend expects camelCase
    
    private mapAccountFromApi(apiAccount: any): Account {
        return {
            id: apiAccount.id,
            name: apiAccount.name,
            type: apiAccount.account_type,
            balance: parseFloat(apiAccount.balance),
            currency: apiAccount.currency,
            color: apiAccount.color,
            icon: apiAccount.icon,
            createdAt: apiAccount.created_at,
        };
    }

    private mapAccountToApi(account: Partial<Account>): any {
        const payload: any = {};
        if (account.name !== undefined) payload.name = account.name;
        if (account.type !== undefined) payload.account_type = account.type;
        if (account.balance !== undefined) payload.balance = account.balance;
        if (account.currency !== undefined) payload.currency = account.currency;
        if (account.color !== undefined) payload.color = account.color;
        if (account.icon !== undefined) payload.icon = account.icon;
        return payload;
    }

    private mapTransactionFromApi(apiTxn: any): Transaction {
        return {
            id: apiTxn.id,
            accountId: apiTxn.account,
            type: apiTxn.transaction_type,
            category: apiTxn.category,
            amount: parseFloat(apiTxn.amount),
            description: apiTxn.description || '',
            date: apiTxn.transaction_date, // or created_at if transaction_date is not datetime
            tags: [], // Tags not supported by backend currently
        };
    }

    private mapTransactionToApi(txn: Partial<Transaction>): any {
        const payload: any = {};
        if (txn.accountId !== undefined) payload.account = txn.accountId;
        if (txn.type !== undefined) payload.transaction_type = txn.type;
        if (txn.category !== undefined) payload.category = txn.category;
        if (txn.amount !== undefined) payload.amount = txn.amount;
        if (txn.description !== undefined) payload.description = txn.description;
        if (txn.date !== undefined) payload.transaction_date = txn.date.split('T')[0]; // Django expects YYYY-MM-DD for DateField
        return payload;
    }

    // --- Implementation ---

    async fetchState(): Promise<FinanceState> {
        // We can fetch accounts and transactions in parallel
        const [apiAccounts, apiTransactions] = await Promise.all([
            this.request<any[]>('/accounts/'),
            this.request<any[]>('/transactions/')
        ]);

        return {
            accounts: apiAccounts.map(this.mapAccountFromApi),
            transactions: apiTransactions.map(this.mapTransactionFromApi),
            categories: DEFAULT_CATEGORIES, // Can be moved to backend later
        };
    }

    async createAccount(accountData: Omit<Account, 'id' | 'createdAt'>): Promise<Account> {
        const payload = this.mapAccountToApi(accountData);
        const result = await this.request<any>('/accounts/', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
        return this.mapAccountFromApi(result);
    }

    async updateAccount(id: string, updates: Partial<Account>): Promise<Account> {
        const payload = this.mapAccountToApi(updates);
        const result = await this.request<any>(`/accounts/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
        });
        return this.mapAccountFromApi(result);
    }

    async deleteAccount(id: string): Promise<void> {
        await this.request<void>(`/accounts/${id}/`, { method: 'DELETE' });
    }

    async createTransaction(transactionData: Omit<Transaction, 'id'>): Promise<Transaction> {
        const payload = this.mapTransactionToApi(transactionData);
        const result = await this.request<any>('/transactions/', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
        return this.mapTransactionFromApi(result);
    }

    async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
        const payload = this.mapTransactionToApi(updates);
        const result = await this.request<any>(`/transactions/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
        });
        return this.mapTransactionFromApi(result);
    }

    async deleteTransaction(id: string): Promise<void> {
        await this.request<void>(`/transactions/${id}/`, { method: 'DELETE' });
    }
}
