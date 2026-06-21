import { Account, Transaction, FinanceState, DEFAULT_CATEGORIES, ACCOUNT_COLORS } from './types';

const STORAGE_KEY = 'pragmatic-finance-data';

export function getStorageData(): FinanceState {
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

export function saveStorageData(data: FinanceState): void {
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

// Initialize data on first load
export function initializeData(): FinanceState {
    if (typeof window === 'undefined') {
        return generateMockData();
    }

    const existing = getStorageData();

    // If no accounts exist, generate mock data
    if (existing.accounts.length === 0) {
        const mockData = generateMockData();
        saveStorageData(mockData);
        return mockData;
    }

    return existing;
}
