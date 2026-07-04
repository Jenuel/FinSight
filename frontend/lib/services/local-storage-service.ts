import { Account, Transaction, FinanceState, DEFAULT_CATEGORIES, ACCOUNT_COLORS } from '../types';
import { DataService } from './data-service';

const STORAGE_KEY = 'pragmatic-finance-data';

function getStorageDataSync(): FinanceState {
    if (typeof window === 'undefined') {
        return { accounts: [], transactions: [], categories: DEFAULT_CATEGORIES };
    }

    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error reading from localStorage:', error);
    }

    return { accounts: [], transactions: [], categories: DEFAULT_CATEGORIES };
}

function saveStorageDataSync(data: FinanceState): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error('Error writing to localStorage:', error);
    }
}

// Generate realistic mock data for demo
export function generateMockData(): FinanceState {
    const now = new Date();
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Create accounts
    const accounts: Account[] = [
        {
            id: 'acc-1',
            name: 'Checking Account',
            type: 'checking',
            balance: 5234.50,
            currency: 'USD',
            createdAt: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString(),
            color: ACCOUNT_COLORS[0],
            icon: '🏦',
        },
        {
            id: 'acc-2',
            name: 'Savings Account',
            type: 'savings',
            balance: 12500.00,
            currency: 'USD',
            createdAt: new Date(now.getTime() - 200 * 24 * 60 * 60 * 1000).toISOString(),
            color: ACCOUNT_COLORS[1],
            icon: '🐷',
        },
        {
            id: 'acc-3',
            name: 'Credit Card',
            type: 'credit',
            balance: -823.45,
            currency: 'USD',
            createdAt: new Date(now.getTime() - 150 * 24 * 60 * 60 * 1000).toISOString(),
            color: ACCOUNT_COLORS[2],
            icon: '💳',
        },
    ];

    // Income and expense data for 3 months
    const transactions: Transaction[] = [];
    const incomeCategories = ['salary', 'freelance', 'bonus'];
    const expenseCategories = ['food', 'transport', 'utilities', 'entertainment', 'shopping', 'subscription'];

    // Add income transactions (monthly salary)
    for (let i = 0; i < 3; i++) {
        const date = new Date(threeMonthsAgo.getTime() + i * 30 * 24 * 60 * 60 * 1000);
        transactions.push({
            id: `txn-income-${i}`,
            accountId: 'acc-1',
            type: 'income',
            category: 'salary',
            amount: 4500,
            description: 'Monthly Salary',
            date: date.toISOString(),
            tags: ['recurring'],
        });
    }

    // Add random expenses throughout the period
    const expenseTemplates = [
        { category: 'food', descriptions: ['Grocery Store', 'Restaurant', 'Coffee Shop'], amounts: [45, 65, 8] },
        { category: 'transport', descriptions: ['Gas', 'Uber', 'Public Transport'], amounts: [50, 15, 3] },
        { category: 'utilities', descriptions: ['Electric Bill', 'Internet', 'Water'], amounts: [120, 60, 35] },
        { category: 'entertainment', descriptions: ['Movie Tickets', 'Netflix', 'Concert'], amounts: [15, 15, 85] },
        { category: 'shopping', descriptions: ['Clothing', 'Electronics', 'Home Goods'], amounts: [75, 200, 45] },
        { category: 'subscription', descriptions: ['Spotify', 'Cloud Storage', 'Software'], amounts: [12, 10, 29] },
    ];

    for (let i = 0; i < 60; i++) {
        const daysOffset = Math.floor(Math.random() * 90);
        const date = new Date(threeMonthsAgo.getTime() + daysOffset * 24 * 60 * 60 * 1000);
        const template = expenseTemplates[Math.floor(Math.random() * expenseTemplates.length)];
        const descriptionIndex = Math.floor(Math.random() * template.descriptions.length);

        transactions.push({
            id: `txn-exp-${i}`,
            accountId: Math.random() > 0.7 ? 'acc-3' : 'acc-1',
            type: 'expense',
            category: template.category,
            amount: template.amounts[descriptionIndex],
            description: template.descriptions[descriptionIndex],
            date: date.toISOString(),
            tags: [],
        });
    }

    // Add a few more income items
    transactions.push({
        id: 'txn-bonus',
        accountId: 'acc-1',
        type: 'income',
        category: 'bonus',
        amount: 1500,
        description: 'Performance Bonus',
        date: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['bonus'],
    });

    transactions.push({
        id: 'txn-freelance',
        accountId: 'acc-1',
        type: 'income',
        category: 'freelance',
        amount: 800,
        description: 'Freelance Project',
        date: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        tags: [],
    });

    return {
        accounts,
        transactions,
        categories: DEFAULT_CATEGORIES,
    };
}

export class LocalStorageService implements DataService {
    async fetchState(): Promise<FinanceState> {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 300));
        
        if (typeof window === 'undefined') {
            return generateMockData();
        }

        const existing = getStorageDataSync();

        if (existing.accounts.length === 0) {
            const mockData = generateMockData();
            saveStorageDataSync(mockData);
            return mockData;
        }

        return existing;
    }

    async createAccount(accountData: Omit<Account, 'id' | 'createdAt'>): Promise<Account> {
        const state = getStorageDataSync();
        const newAccount: Account = {
            ...accountData,
            id: `acc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            createdAt: new Date().toISOString(),
        };
        state.accounts.push(newAccount);
        saveStorageDataSync(state);
        return newAccount;
    }

    async updateAccount(id: string, updates: Partial<Account>): Promise<Account> {
        const state = getStorageDataSync();
        const index = state.accounts.findIndex(a => a.id === id);
        if (index === -1) throw new Error('Account not found');
        
        const updatedAccount = { ...state.accounts[index], ...updates };
        state.accounts[index] = updatedAccount;
        saveStorageDataSync(state);
        return updatedAccount;
    }

    async deleteAccount(id: string): Promise<void> {
        const state = getStorageDataSync();
        state.accounts = state.accounts.filter(a => a.id !== id);
        state.transactions = state.transactions.filter(t => t.accountId !== id);
        saveStorageDataSync(state);
    }

    async createTransaction(transactionData: Omit<Transaction, 'id'>): Promise<Transaction> {
        const state = getStorageDataSync();
        const newTransaction: Transaction = {
            ...transactionData,
            id: `txn-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        };
        state.transactions.push(newTransaction);
        
        // Update account balance
        const accountIndex = state.accounts.findIndex(a => a.id === transactionData.accountId);
        if (accountIndex !== -1) {
            const amount = newTransaction.type === 'income' ? newTransaction.amount : -newTransaction.amount;
            state.accounts[accountIndex].balance += amount;
        }

        saveStorageDataSync(state);
        return newTransaction;
    }

    async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
        const state = getStorageDataSync();
        const index = state.transactions.findIndex(t => t.id === id);
        if (index === -1) throw new Error('Transaction not found');
        
        const oldTransaction = state.transactions[index];
        const updatedTransaction = { ...oldTransaction, ...updates };
        
        // Handle balance update if amount or type changed, or account changed
        // This is complex, but for mock local storage we can just recalculate all balances
        // Or apply simple diff if only amount changed on same account.
        // For simplicity, let's recalculate balances from scratch for the affected accounts
        
        state.transactions[index] = updatedTransaction;
        
        // Recalculate balances
        state.accounts.forEach(acc => {
            let balance = 0; // Ideally starting balance, but we'll assume transactions give net change
            // Actually, we don't know the starting balance without transactions.
            // Let's do a simple diff.
        });
        
        // Better simple diff logic:
        const oldAmount = oldTransaction.type === 'income' ? oldTransaction.amount : -oldTransaction.amount;
        const newAmount = updatedTransaction.type === 'income' ? updatedTransaction.amount : -updatedTransaction.amount;
        
        if (oldTransaction.accountId === updatedTransaction.accountId) {
            const accIndex = state.accounts.findIndex(a => a.id === oldTransaction.accountId);
            if (accIndex !== -1) {
                state.accounts[accIndex].balance += (newAmount - oldAmount);
            }
        } else {
            const oldAccIndex = state.accounts.findIndex(a => a.id === oldTransaction.accountId);
            if (oldAccIndex !== -1) {
                state.accounts[oldAccIndex].balance -= oldAmount;
            }
            const newAccIndex = state.accounts.findIndex(a => a.id === updatedTransaction.accountId);
            if (newAccIndex !== -1) {
                state.accounts[newAccIndex].balance += newAmount;
            }
        }

        saveStorageDataSync(state);
        return updatedTransaction;
    }

    async deleteTransaction(id: string): Promise<void> {
        const state = getStorageDataSync();
        const transaction = state.transactions.find(t => t.id === id);
        if (!transaction) return;

        state.transactions = state.transactions.filter(t => t.id !== id);
        
        // Reverse balance
        const accIndex = state.accounts.findIndex(a => a.id === transaction.accountId);
        if (accIndex !== -1) {
            const amount = transaction.type === 'income' ? transaction.amount : -transaction.amount;
            state.accounts[accIndex].balance -= amount;
        }

        saveStorageDataSync(state);
    }
}
