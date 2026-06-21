export type TransactionType = 'income' | 'expense';

export interface Category {
    id: string;
    name: string;
    icon: string;
    type: TransactionType;
}

export interface Account {
    id: string;
    name: string;
    type: 'checking' | 'savings' | 'credit';
    balance: number;
    currency: string;
    createdAt: string;
    color: string;
    icon: string;
}

export interface Transaction {
    id: string;
    accountId: string;
    type: TransactionType;
    category: string;
    amount: number;
    description: string;
    date: string;
    tags: string[];
}

export interface FinanceState {
    accounts: Account[];
    transactions: Transaction[];
    categories: Category[];
}

// Default categories
export const DEFAULT_CATEGORIES: Category[] = [
    // Income categories
    { id: 'salary', name: 'Salary', icon: '💰', type: 'income' },
    { id: 'bonus', name: 'Bonus', icon: '🎁', type: 'income' },
    { id: 'freelance', name: 'Freelance', icon: '💻', type: 'income' },
    { id: 'investment', name: 'Investment', icon: '📈', type: 'income' },
    { id: 'other-income', name: 'Other Income', icon: '⭐', type: 'income' },

    // Expense categories
    { id: 'food', name: 'Food & Dining', icon: '🍔', type: 'expense' },
    { id: 'transport', name: 'Transport', icon: '🚗', type: 'expense' },
    { id: 'utilities', name: 'Utilities', icon: '💡', type: 'expense' },
    { id: 'entertainment', name: 'Entertainment', icon: '🎬', type: 'expense' },
    { id: 'healthcare', name: 'Healthcare', icon: '🏥', type: 'expense' },
    { id: 'shopping', name: 'Shopping', icon: '🛍️', type: 'expense' },
    { id: 'subscription', name: 'Subscriptions', icon: '📱', type: 'expense' },
    { id: 'travel', name: 'Travel', icon: '✈️', type: 'expense' },
    { id: 'other-expense', name: 'Other', icon: '📌', type: 'expense' },
];

export const ACCOUNT_COLORS = [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#ec4899', // pink
];
