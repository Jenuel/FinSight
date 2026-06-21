'use client';

import { useState } from 'react';
import { Plus, Trash2, HelpCircle } from 'lucide-react';
import { useFinance } from '@/lib/context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button-custom';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DEFAULT_CATEGORIES, TransactionType } from '@/lib/types';
import { parseQuickLog, getFormatGuide, ParsedTransaction } from '@/lib/quick-log-parser';

interface TransactionsPageProps {
    isModalOpen?: boolean;
    setIsModalOpen?: (open: boolean) => void;
}

export function TransactionsPage({ isModalOpen: externalModalOpen, setIsModalOpen: setExternalModalOpen }: TransactionsPageProps) {
    const { state, addTransaction, deleteTransaction } = useFinance();
    const [localModalOpen, setLocalModalOpen] = useState(false);

    const isModalOpen = externalModalOpen !== undefined ? externalModalOpen : localModalOpen;
    const setIsModalOpen = setExternalModalOpen !== undefined ? setExternalModalOpen : setLocalModalOpen;

    const [isQuickLogMode, setIsQuickLogMode] = useState(true);
    const [showFormatGuide, setShowFormatGuide] = useState(false);
    const [quickLogInput, setQuickLogInput] = useState('');
    const [quickLogPreview, setQuickLogPreview] = useState<ParsedTransaction>({ type: 'expense', amount: 0, category: '', description: '', isValid: false, message: '' });

    const [lastParsed, setLastParsed] = useState<{
        type: TransactionType;
        amount: number;
        category: string;
        description: string;
        date: string | null;
        accountId: string | null;
    }>({
        type: 'expense',
        amount: 0,
        category: '',
        description: '',
        date: null,
        accountId: null,
    });

    const [formData, setFormData] = useState<{
        accountId: string;
        type: TransactionType;
        category: string;
        amount: number;
        description: string;
        date: string;
    }>({
        accountId: state.accounts[0]?.id || '',
        type: 'expense',
        category: 'food',
        amount: 0,
        description: '',
        date: new Date().toISOString().split('T')[0],
    });

    const handleQuickLogChange = (value: string) => {
        setQuickLogInput(value);
        const preview = parseQuickLog(value, state.accounts);
        setQuickLogPreview(preview);

        if (preview.isValid) {
            setFormData((prev) => {
                const updated = { ...prev };
                
                updated.amount = preview.amount;
                updated.type = preview.type;
                updated.description = preview.description;

                // Sync parsed category only if it differs from the previous parsed category (respects manual overrides)
                if (preview.category !== lastParsed.category) {
                    updated.category = preview.category;
                }

                // Sync parsed account only if it differs from the previous parsed account (respects manual overrides)
                if (preview.accountId && preview.accountId !== lastParsed.accountId) {
                    updated.accountId = preview.accountId;
                }

                // Sync parsed date only if it differs from the previous parsed date (respects manual overrides)
                if (preview.dateString && preview.dateString !== lastParsed.date) {
                    updated.date = preview.dateString;
                }

                return updated;
            });

            setLastParsed({
                type: preview.type,
                amount: preview.amount,
                category: preview.category,
                description: preview.description,
                date: preview.dateString || null,
                accountId: preview.accountId || null,
            });
        }
    };

    const handleQuickLogSubmit = () => {
        if (!quickLogPreview.isValid) return;

        const selectedAccount = state.accounts.find((acc) => acc.id === formData.accountId);
        if (!selectedAccount) return;

        addTransaction({
            id: `txn-${Date.now()}`,
            accountId: formData.accountId,
            type: formData.type,
            category: formData.category,
            amount: formData.amount,
            description: formData.description || 'Quick Log',
            date: new Date(formData.date).toISOString(),
            tags: [],
        });

        handleClose();
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.description.trim() || formData.amount <= 0) return;

        const date = new Date(formData.date);

        addTransaction({
            id: `txn-${Date.now()}`,
            accountId: formData.accountId,
            type: formData.type,
            category: formData.category,
            amount: formData.amount,
            description: formData.description,
            date: date.toISOString(),
            tags: [],
        });

        setFormData({
            accountId: state.accounts[0]?.id || '',
            type: 'expense',
            category: 'food',
            amount: 0,
            description: '',
            date: new Date().toISOString().split('T')[0],
        });
        setIsModalOpen(false);
    };

    const handleClose = () => {
        setIsModalOpen(false);
        setQuickLogInput('');
        setQuickLogPreview({ type: 'expense', amount: 0, category: '', description: '', isValid: false, message: '' });
        setLastParsed({ type: 'expense', amount: 0, category: '', description: '', date: null, accountId: null });
        setFormData({
            accountId: state.accounts[0]?.id || '',
            type: 'expense',
            category: 'food',
            amount: 0,
            description: '',
            date: new Date().toISOString().split('T')[0],
        });
        setIsQuickLogMode(true);
    };

    const expenseCategories = DEFAULT_CATEGORIES.filter((cat) => cat.type === 'expense');
    const incomeCategories = DEFAULT_CATEGORIES.filter((cat) => cat.type === 'income');

    const sortedTransactions = [...state.transactions].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const totalIncome = state.transactions
        .filter((txn) => txn.type === 'income')
        .reduce((sum, txn) => sum + txn.amount, 0);
    const totalExpense = state.transactions
        .filter((txn) => txn.type === 'expense')
        .reduce((sum, txn) => sum + txn.amount, 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Transactions</h1>
                    <p className="text-muted-foreground mt-1">Track your income and expenses</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Transaction
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground">Total Income</p>
                        <p className="text-3xl font-bold income-text">
                            +${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground">Total Expense</p>
                        <p className="text-3xl font-bold expense-text">
                            -${totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {sortedTransactions.length > 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {sortedTransactions.slice(0, 50).map((txn) => {
                                const category = DEFAULT_CATEGORIES.find((cat) => cat.id === txn.category);
                                const account = state.accounts.find((acc) => acc.id === txn.accountId);

                                return (
                                    <div key={txn.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors border border-transparent hover:border-border">
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="text-2xl">{category?.icon}</div>
                                            <div className="flex-1">
                                                <p className="font-medium text-foreground">{txn.description}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {account?.name} • {new Date(txn.date).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-sm font-semibold ${txn.type === 'income' ? 'income-text' : 'expense-text'}`}>
                                                {txn.type === 'income' ? '+' : '-'}${txn.amount.toFixed(2)}
                                            </span>
                                            <Button
                                                onClick={() => {
                                                    if (window.confirm('Delete this transaction?')) {
                                                        deleteTransaction(txn.id);
                                                    }
                                                }}
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="p-12 text-center">
                        <p className="text-muted-foreground mb-4">No transactions yet. Create one to get started!</p>
                        <Button onClick={() => setIsModalOpen(true)}>Add Transaction</Button>
                    </CardContent>
                </Card>
            )}

            <Modal
                open={isModalOpen}
                onOpenChange={handleClose}
                title="Add Transaction"
                size="md"
                footer={
                    <div className="flex gap-2 justify-end">
                        <Button variant="ghost" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button
                            onClick={isQuickLogMode ? handleQuickLogSubmit : handleFormSubmit}
                            disabled={isQuickLogMode && !quickLogPreview.isValid}
                        >
                            Add Transaction
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <div className="flex gap-2 mb-4">
                        <button
                            onClick={() => setIsQuickLogMode(true)}
                            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${isQuickLogMode ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-muted/80'
                                }`}
                        >
                            Quick Log
                        </button>
                        <button
                            onClick={() => setIsQuickLogMode(false)}
                            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${!isQuickLogMode ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-muted/80'
                                }`}
                        >
                            Detailed
                        </button>
                    </div>

                    {isQuickLogMode ? (
                        <div className="space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-foreground">Quick Log</label>
                                    <button
                                        onClick={() => setShowFormatGuide(!showFormatGuide)}
                                        className="text-primary hover:text-primary/80 flex items-center gap-1"
                                        type="button"
                                    >
                                        <HelpCircle className="w-4 h-4" />
                                        Format
                                    </button>
                                </div>

                                {showFormatGuide && (
                                    <div className="bg-muted p-3 rounded-md mb-3 text-xs whitespace-pre-line text-muted-foreground">
                                        {getFormatGuide()}
                                    </div>
                                )}

                                <Input
                                    placeholder='e.g., "50 food on Jun 1" or "+1000 salary"'
                                    value={quickLogInput}
                                    onChange={(e) => handleQuickLogChange(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && quickLogPreview.isValid) {
                                            handleQuickLogSubmit();
                                        }
                                    }}
                                />
                            </div>

                            {quickLogInput && (
                                <div className={`p-3 rounded-md ${quickLogPreview.isValid ? 'bg-[var(--income)]/10' : 'bg-destructive/10'}`}>
                                    <p className={`text-sm font-medium ${quickLogPreview.isValid ? 'income-text' : 'text-destructive'}`}>
                                        {quickLogPreview.message}
                                    </p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                                <Select
                                    label="Account"
                                    value={formData.accountId}
                                    onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                                    options={state.accounts.map((acc) => ({ value: acc.id, label: acc.name }))}
                                />

                                <Select
                                    label="Category"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    options={(formData.type === 'income' ? incomeCategories : expenseCategories).map((cat) => ({
                                        value: cat.id,
                                        label: `${cat.icon} ${cat.name}`,
                                    }))}
                                />

                                <Input
                                    label="Date"
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                />
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleFormSubmit} className="space-y-4">
                            <Select
                                label="Account"
                                value={formData.accountId}
                                onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                                options={state.accounts.map((acc) => ({ value: acc.id, label: acc.name }))}
                            />

                            <Select
                                label="Type"
                                value={formData.type}
                                onChange={(e) =>
                                    setFormData({ ...formData, type: e.target.value as 'income' | 'expense', category: formData.type === 'income' ? 'salary' : 'food' })
                                }
                                options={[
                                    { value: 'income', label: 'Income' },
                                    { value: 'expense', label: 'Expense' },
                                ]}
                            />

                            <Select
                                label="Category"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                options={(formData.type === 'income' ? incomeCategories : expenseCategories).map((cat) => ({
                                    value: cat.id,
                                    label: `${cat.icon} ${cat.name}`,
                                }))}
                            />

                            <Input
                                label="Amount"
                                type="number"
                                placeholder="0.00"
                                step="0.01"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                                required
                            />

                            <Input
                                label="Description"
                                placeholder="What was this for?"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                required
                            />

                            <Input
                                label="Date"
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            />
                        </form>
                    )}
                </div>
            </Modal>
        </div>
    );
}
