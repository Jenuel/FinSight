'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, HelpCircle, FileText } from 'lucide-react';
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

    const quickLogInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const activeEl = document.activeElement;
            if (
                activeEl &&
                (activeEl.tagName === 'INPUT' ||
                 activeEl.tagName === 'TEXTAREA' ||
                 activeEl.getAttribute('contenteditable') === 'true')
            ) {
                return;
            }

            if (e.key === 'n' || e.key === 'N') {
                e.preventDefault();
                setIsModalOpen(true);
                setTimeout(() => {
                    quickLogInputRef.current?.focus();
                }, 50);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setIsModalOpen]);

    useEffect(() => {
        if (isModalOpen) {
            const timer = setTimeout(() => {
                quickLogInputRef.current?.focus();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isModalOpen]);

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
                size="lg"
                footer={
                    <div className="flex gap-2 justify-end">
                        <Button variant="ghost" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleQuickLogSubmit}
                            disabled={!quickLogPreview.isValid}
                        >
                            Add Transaction
                        </Button>
                    </div>
                }
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column: Big Amount Display, Quick Log Input, Account, Date */}
                    <div className="space-y-4 flex flex-col justify-between">
                        {/* Big visual Amount Display */}
                        <div className={`flex flex-col items-center justify-center p-6 rounded-2xl border transition-all duration-200 flex-1 min-h-[130px] ${
                            quickLogPreview.isValid
                                ? formData.type === 'income'
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                                : 'bg-secondary/30 border-border/40 text-muted-foreground/40'
                        }`}>
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-1 select-none">
                                Parsed Amount
                            </span>
                            <div className="text-4xl font-extrabold tracking-tight text-center select-all">
                                {quickLogPreview.isValid
                                    ? `${formData.type === 'income' ? '+' : '-'}$${formData.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                    : '$0.00'}
                            </div>
                            {quickLogPreview.isValid && (
                                <span className="text-xs font-semibold capitalize mt-1.5 opacity-85">
                                    {formData.type} transaction
                                </span>
                            )}
                        </div>

                        {/* Quick Log Input Section */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/80">Quick Log Input</label>
                                <button
                                    onClick={() => setShowFormatGuide(!showFormatGuide)}
                                    className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 font-medium transition-colors cursor-pointer"
                                    type="button"
                                >
                                    <HelpCircle className="w-3.5 h-3.5" />
                                    {showFormatGuide ? 'Hide Format' : 'Show Format'}
                                </button>
                            </div>

                            {showFormatGuide && (
                                <div className="bg-secondary/50 border border-border/50 p-3 rounded-xl text-xs whitespace-pre-line text-muted-foreground leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
                                    {getFormatGuide()}
                                </div>
                            )}

                            <Input
                                ref={quickLogInputRef}
                                placeholder='e.g., "50 food for lunch on Jun 1" or "+1000 salary"'
                                value={quickLogInput}
                                onChange={(e) => handleQuickLogChange(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && quickLogPreview.isValid) {
                                        handleQuickLogSubmit();
                                    }
                                }}
                                className="h-12 text-base md:text-lg font-medium tracking-tight bg-secondary/20 border-border/50 placeholder:text-muted-foreground/35 placeholder:font-normal placeholder:text-sm md:placeholder:text-base"
                            />
                        </div>

                        {/* Live parsing status badge/banner */}
                        {quickLogInput && (
                            <div className={`p-3 rounded-xl border text-xs transition-colors ${
                                quickLogPreview.isValid
                                    ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-rose-500/5 border-rose-500/20 text-rose-600 dark:text-rose-400'
                            }`}>
                                <p className="font-medium">
                                    {quickLogPreview.message}
                                </p>
                            </div>
                        )}

                        {/* Interactive Overrides: Account, Type & Date */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/80">Account</label>
                                <Select
                                    value={formData.accountId}
                                    onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                                    options={state.accounts.map((acc) => ({ value: acc.id, label: acc.name }))}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/80">Date</label>
                                <Input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Description & Visual Category Selector Grid */}
                    <div className="space-y-4 border-t md:border-t-0 md:border-l border-border/45 pt-4 md:pt-0 md:pl-6 flex flex-col justify-between">
                        {/* Custom Parsed Description Display Tile */}
                        <div className="flex flex-col p-4 bg-secondary/20 dark:bg-secondary/10 rounded-xl border border-border/40 min-h-[76px] justify-center relative overflow-hidden transition-all duration-200">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/80 mb-1 select-none">
                                Parsed Description
                            </span>
                            <div className="flex items-center gap-2">
                                <FileText className={`w-4 h-4 shrink-0 transition-colors ${formData.description ? 'text-primary' : 'text-muted-foreground/45'}`} />
                                <span className={`text-base font-semibold truncate ${formData.description ? 'text-foreground' : 'text-muted-foreground/40 italic font-normal'}`}>
                                    {formData.description || 'Description parsed from Quick Log'}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2 flex-1 flex flex-col justify-start">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
                                    Select Category ({formData.type === 'income' ? 'Income' : 'Expense'})
                                </label>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 max-h-[220px] overflow-y-auto pr-1">
                                {(formData.type === 'income' ? incomeCategories : expenseCategories).map((cat) => {
                                    const isSelected = formData.category === cat.id;
                                    return (
                                        <button
                                            key={cat.id}
                                            onClick={() => setFormData({ ...formData, category: cat.id })}
                                            className={`py-2 px-2.5 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all border cursor-pointer select-none text-center h-[72px] ${
                                                isSelected
                                                    ? 'bg-primary/10 border-primary text-primary font-bold scale-102 ring-2 ring-primary/20 shadow-sm'
                                                    : 'bg-secondary/40 border-border/50 hover:bg-secondary/80 text-muted-foreground hover:text-foreground hover:scale-102'
                                            }`}
                                            type="button"
                                        >
                                            <span className="text-xl leading-none">{cat.icon}</span>
                                            <span className="text-[10px] tracking-tight font-medium truncate w-full">{cat.name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
