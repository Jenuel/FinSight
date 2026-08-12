import { Account, Transaction, FinanceState } from '../types';

export interface DataService {
    fetchState(): Promise<FinanceState>;
    
    // Accounts
    createAccount(account: Omit<Account, 'id' | 'createdAt'>): Promise<Account>;
    updateAccount(id: string, updates: Partial<Account>): Promise<Account>;
    deleteAccount(id: string): Promise<void>;
    
    // Transactions
    createTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction>;
    updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction>;
    deleteTransaction(id: string): Promise<void>;
}

import { LocalStorageService } from './local-storage-service';
import { ApiService } from './api-service';

// Single source of truth for which backend the app talks to. Resolved at build
// time (NEXT_PUBLIC_* is inlined by Next.js). When IS_API_MODE is true the app
// uses the Django API and authenticates with Clerk; otherwise it runs fully on
// localStorage for both authentication and dashboard data.
export const DATA_SOURCE = process.env.NEXT_PUBLIC_DATA_SOURCE || 'local';
export const IS_API_MODE = DATA_SOURCE === 'api';

// LocalStorageService is stateless and can be a singleton.
// ApiService requires a per-render getToken function, so it is instantiated in context.
let localServiceInstance: LocalStorageService | null = null;

export function getDataService(getToken?: () => Promise<string | null>): DataService {
    if (IS_API_MODE) {
        if (!getToken) {
            throw new Error('getDataService: getToken is required when NEXT_PUBLIC_DATA_SOURCE=api');
        }
        return new ApiService(getToken);
    }

    if (!localServiceInstance) {
        localServiceInstance = new LocalStorageService();
    }
    return localServiceInstance;
}
