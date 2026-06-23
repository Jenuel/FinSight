'use client';

import { useMemo } from 'react';
import { useFinance } from '@/lib/context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DEFAULT_CATEGORIES } from '@/lib/types';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

export function DashboardPage() {
    const { state } = useFinance();

    const stats = useMemo(() => {
        const totalIncome = state.transactions
            .filter((txn) => txn.type === 'income')
            .reduce((sum, txn) => sum + txn.amount, 0);

        const totalExpense = state.transactions
            .filter((txn) => txn.type === 'expense')
            .reduce((sum, txn) => sum + txn.amount, 0);

        const netIncome = totalIncome - totalExpense;
        const totalBalance = state.accounts.reduce((sum, acc) => sum + acc.balance, 0);

        // Last 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const recentTransactions = state.transactions
            .filter((txn) => new Date(txn.date) >= thirtyDaysAgo)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);

        const thisMonthExpense = state.transactions
            .filter((txn) => txn.type === 'expense' && new Date(txn.date) >= thirtyDaysAgo)
            .reduce((sum, txn) => sum + txn.amount, 0);

        return {
            totalIncome,
            totalExpense,
            netIncome,
            totalBalance,
            recentTransactions,
            thisMonthExpense,
        };
    }, [state]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
                <p className="text-muted-foreground mt-1">Welcome to Pragmatic Finance</p>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-muted-foreground">Total Balance</p>
                            <Wallet className="w-4 h-4 text-primary" />
                        </div>
                        <p className="text-2xl font-bold text-foreground">
                            ${stats.totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{state.accounts.length} accounts</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-muted-foreground">Total Income</p>
                            <TrendingUp className="w-4 h-4 income-text" />
                        </div>
                        <p className="text-2xl font-bold income-text">
                            ${stats.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">All time</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-muted-foreground">Total Expense</p>
                            <TrendingDown className="w-4 h-4 expense-text" />
                        </div>
                        <p className="text-2xl font-bold expense-text">
                            ${stats.totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">All time</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-muted-foreground">This Month</p>
                            <TrendingDown className="w-4 h-4 text-primary" />
                        </div>
                        <p className="text-2xl font-bold text-foreground">
                            ${stats.thisMonthExpense.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Spending</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Net Income Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Net Income</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className={`text-3xl font-bold ${stats.netIncome >= 0 ? 'income-text' : 'expense-text'}`}>
                            {stats.netIncome >= 0 ? '+' : ''}${stats.netIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                            Income minus expenses
                        </p>
                    </CardContent>
                </Card>

                {/* Accounts Overview */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Your Accounts</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {state.accounts.length > 0 ? (
                            state.accounts.slice(0, 3).map((account) => (
                                <div key={account.id} className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">{account.name}</span>
                                    <span className="font-medium">
                                        ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-muted-foreground">No accounts yet</p>
                        )}
                        {state.accounts.length > 3 && (
                            <p className="text-xs text-primary mt-2">+{state.accounts.length - 3} more</p>
                        )}
                    </CardContent>
                </Card>

                {/* Transaction Count */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Transaction Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Total Transactions</span>
                            <span className="font-medium">{state.transactions.length}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">This Month</span>
                            <span className="font-medium">{stats.recentTransactions.length}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Categories</span>
                            <span className="font-medium">{DEFAULT_CATEGORIES.length}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Transactions */}
            {stats.recentTransactions.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Transactions (Last 30 Days)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {stats.recentTransactions.map((txn) => {
                                const category = DEFAULT_CATEGORIES.find((cat) => cat.id === txn.category);
                                const account = state.accounts.find((acc) => acc.id === txn.accountId);

                                return (
                                    <div key={txn.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="text-2xl">{category?.icon}</div>
                                            <div>
                                                <p className="font-medium text-foreground text-sm">{txn.description}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {account?.name} • {new Date(txn.date).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div
                                            className={`font-semibold ${txn.type === 'income' ? 'income-text' : 'expense-text'}`}
                                        >
                                            {txn.type === 'income' ? '+' : '-'}${txn.amount.toFixed(2)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
