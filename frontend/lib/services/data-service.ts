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

let serviceInstance: DataService | null = null;

export function getDataService(): DataService {
    if (serviceInstance) return serviceInstance;

    const source = process.env.NEXT_PUBLIC_DATA_SOURCE || 'local';
    
    if (source === 'api') {
        serviceInstance = new ApiService();
    } else {
        serviceInstance = new LocalStorageService();
    }
    
    return serviceInstance;
}
