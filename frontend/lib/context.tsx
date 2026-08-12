'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Account, Transaction, Category, FinanceState } from './types';
import { getDataService } from './services/data-service';
import { useAuth } from '@clerk/nextjs';

interface FinanceContextType {
    state: FinanceState;
    isLoaded: boolean;
    error: string | null;
    addAccount: (account: Omit<Account, 'id' | 'createdAt'>) => Promise<void>;
    updateAccount: (id: string, updates: Partial<Account>) => Promise<void>;
    deleteAccount: (id: string) => Promise<void>;
    addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
    updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
    deleteTransaction: (id: string) => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<FinanceState>({ accounts: [], transactions: [], categories: [] });
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { getToken } = useAuth();

    // Stable getToken wrapper to use as a dependency / pass to services
    const stableGetToken = useCallback(() => getToken(), [getToken]);

    // Initialize data on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                const service = getDataService(stableGetToken);
                const data = await service.fetchState();
                setState(data);
                setIsLoaded(true);
            } catch (err: any) {
                console.error("Failed to load data:", err);
                setError(err.message || "Failed to load data");
            }
        };
        
        loadData();
    }, [stableGetToken]);

    const addAccount = async (accountData: Omit<Account, 'id' | 'createdAt'>) => {
        try {
            const service = getDataService(stableGetToken);
            const newAccount = await service.createAccount(accountData);
            setState((prev) => ({
                ...prev,
                accounts: [...prev.accounts, newAccount],
            }));
        } catch (err: any) {
            console.error("Failed to create account", err);
            throw err;
        }
    };

    const updateAccount = async (id: string, updates: Partial<Account>) => {
        try {
            const service = getDataService(stableGetToken);
            const updatedAccount = await service.updateAccount(id, updates);
            setState((prev) => ({
                ...prev,
                accounts: prev.accounts.map((acc) => (acc.id === id ? updatedAccount : acc)),
            }));
        } catch (err: any) {
            console.error("Failed to update account", err);
            throw err;
        }
    };

    const deleteAccount = async (id: string) => {
        try {
            const service = getDataService(stableGetToken);
            await service.deleteAccount(id);
            setState((prev) => ({
                ...prev,
                accounts: prev.accounts.filter((acc) => acc.id !== id),
                transactions: prev.transactions.filter((txn) => txn.accountId !== id),
            }));
        } catch (err: any) {
            console.error("Failed to delete account", err);
            throw err;
        }
    };

    const addTransaction = async (transactionData: Omit<Transaction, 'id'>) => {
        try {
            const service = getDataService(stableGetToken);
            const newTransaction = await service.createTransaction(transactionData);
            
            setState((prev) => {
                const newTransactions = [...prev.transactions, newTransaction];
                const newAccounts = prev.accounts.map(acc => {
                    if (acc.id === newTransaction.accountId) {
                        const amount = newTransaction.type === 'income' ? newTransaction.amount : -newTransaction.amount;
                        return { ...acc, balance: acc.balance + amount };
                    }
                    return acc;
                });

                return {
                    ...prev,
                    transactions: newTransactions,
                    accounts: newAccounts,
                };
            });
        } catch (err: any) {
            console.error("Failed to create transaction", err);
            throw err;
        }
    };

    const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
        try {
            const service = getDataService(stableGetToken);
            const updatedTransaction = await service.updateTransaction(id, updates);
            
            // Refetch state for perfect balance synchronization
            const newState = await service.fetchState();
            setState(newState);
            
        } catch (err: any) {
            console.error("Failed to update transaction", err);
            throw err;
        }
    };

    const deleteTransaction = async (id: string) => {
        try {
            const service = getDataService(stableGetToken);
            await service.deleteTransaction(id);
            
            // Refetch state for perfect synchronization, especially for account balances.
            const newState = await service.fetchState();
            setState(newState);

        } catch (err: any) {
            console.error("Failed to delete transaction", err);
            throw err;
        }
    };

    return (
        <FinanceContext.Provider value={{ state, isLoaded, error, addAccount, updateAccount, deleteAccount, addTransaction, updateTransaction, deleteTransaction }}>
            {children}
        </FinanceContext.Provider>
    );
}

export function useFinance() {
    const context = useContext(FinanceContext);
    if (!context) {
        throw new Error('useFinance must be used within FinanceProvider');
    }
    return context;
}
