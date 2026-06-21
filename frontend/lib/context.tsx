'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Account, Transaction, Category, FinanceState } from './types';
import { getStorageData, saveStorageData, initializeData } from './storage';

interface FinanceContextType {
    state: FinanceState;
    addAccount: (account: Account) => void;
    updateAccount: (id: string, updates: Partial<Account>) => void;
    deleteAccount: (id: string) => void;
    addTransaction: (transaction: Transaction) => void;
    updateTransaction: (id: string, updates: Partial<Transaction>) => void;
    deleteTransaction: (id: string) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<FinanceState>({ accounts: [], transactions: [], categories: [] });
    const [isLoaded, setIsLoaded] = useState(false);

    // Initialize data on mount
    useEffect(() => {
        const data = initializeData();
        setState(data);
        setIsLoaded(true);
    }, []);

    // Save to localStorage whenever state changes
    useEffect(() => {
        if (isLoaded) {
            saveStorageData(state);
        }
    }, [state, isLoaded]);

    const addAccount = (account: Account) => {
        setState((prev) => ({
            ...prev,
            accounts: [...prev.accounts, account],
        }));
    };

    const updateAccount = (id: string, updates: Partial<Account>) => {
        setState((prev) => ({
            ...prev,
            accounts: prev.accounts.map((acc) => (acc.id === id ? { ...acc, ...updates } : acc)),
        }));
    };

    const deleteAccount = (id: string) => {
        setState((prev) => ({
            ...prev,
            accounts: prev.accounts.filter((acc) => acc.id !== id),
            transactions: prev.transactions.filter((txn) => txn.accountId !== id),
        }));
    };

    const addTransaction = (transaction: Transaction) => {
        setState((prev) => ({
            ...prev,
            transactions: [...prev.transactions, transaction],
        }));

        // Update account balance
        updateAccount(transaction.accountId, {
            balance:
                state.accounts.find((acc) => acc.id === transaction.accountId)?.balance! +
                (transaction.type === 'income' ? transaction.amount : -transaction.amount),
        });
    };

    const updateTransaction = (id: string, updates: Partial<Transaction>) => {
        setState((prev) => ({
            ...prev,
            transactions: prev.transactions.map((txn) => (txn.id === id ? { ...txn, ...updates } : txn)),
        }));
    };

    const deleteTransaction = (id: string) => {
        const transaction = state.transactions.find((txn) => txn.id === id);
        if (transaction) {
            // Reverse the transaction from account balance
            updateAccount(transaction.accountId, {
                balance:
                    state.accounts.find((acc) => acc.id === transaction.accountId)?.balance! -
                    (transaction.type === 'income' ? transaction.amount : -transaction.amount),
            });
        }

        setState((prev) => ({
            ...prev,
            transactions: prev.transactions.filter((txn) => txn.id !== id),
        }));
    };

    return (
        <FinanceContext.Provider value={{ state, addAccount, updateAccount, deleteAccount, addTransaction, updateTransaction, deleteTransaction }}>
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
