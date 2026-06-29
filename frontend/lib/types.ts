export type TransactionType = 'income' | 'expense';

export interface Category {
    id: string;
    name: string;
    icon: string;
    type: TransactionType;
}

export interface Account {
    id: string;
    userid: string;
    name: string;
    account_type: 'checking' | 'savings' | 'credit' | 'cash' | 'ewallet';
    balance: string;
    currency: string;
    color: string;
    icon: string;
    created_at: string;
    updated_at: string;
}

export type EntryType = 'exact' | 'estimated' | 'manual';
export type ReconciliationStatus = 'unreconciled' | 'reconciled' | 'excluded';

export interface Transaction {
    id: string;
    account: string;
    transaction_type: 'income' | 'expense';
    amount: string;
    category: string;
    description: string;
    transaction_date: string;
    entry_type: EntryType;
    reconciliation_status: ReconciliationStatus;
    reconciliation_session: string | null;
    is_adjustment: boolean;
    is_backdated: boolean;
    created_at: string;
    updated_at: string;
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
