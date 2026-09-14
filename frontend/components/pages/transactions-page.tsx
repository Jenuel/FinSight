'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  HelpCircle, 
  FileText, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  SlidersHorizontal, 
  X,
  Wallet,
  RotateCcw
} from 'lucide-react';
import { useFinance } from '@/lib/context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button-custom';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { DEFAULT_CATEGORIES, TransactionType } from '@/lib/types';
import { parseQuickLog, getFormatGuide, ParsedTransaction } from '@/lib/quick-log-parser';
import { FinanceIcon } from '@/components/ui/finance-icon';

interface TransactionsPageProps {
    isModalOpen?: boolean;
    setIsModalOpen?: (open: boolean) => void;
}

export function TransactionsPage({ isModalOpen: externalModalOpen, setIsModalOpen: setExternalModalOpen }: TransactionsPageProps) {
    const { state, addTransaction, deleteTransaction } = useFinance();
    const [localModalOpen, setLocalModalOpen] = useState(false);
    const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null);

    const isModalOpen = externalModalOpen !== undefined ? externalModalOpen : localModalOpen;
    const setIsModalOpen = setExternalModalOpen !== undefined ? setExternalModalOpen : setLocalModalOpen;

    // Filter and search states
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
    const [accountFilter, setAccountFilter] = useState<string>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');

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
    const [quickLogPreview, setQuickLogPreview] = useState<ParsedTransaction>({ 
        type: 'expense', 
        amount: 0, 
        category: '', 
        description: '', 
        isValid: false, 
        message: '' 
    });

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

                if (preview.category !== lastParsed.category) {
                    updated.category = preview.category;
                }

                if (preview.accountId && preview.accountId !== lastParsed.accountId) {
                    updated.accountId = preview.accountId;
                }

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

    const handleQuickLogSubmit = async () => {
        if (!quickLogPreview.isValid) return;

        const selectedAccount = state.accounts.find((acc) => acc.id === formData.accountId);
        if (!selectedAccount) return;

        await addTransaction({
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

    // Total income and expenses
    const totalIncome = useMemo(() => {
        return state.transactions
            .filter((txn) => txn.type === 'income')
            .reduce((sum, txn) => sum + txn.amount, 0);
    }, [state.transactions]);

    const totalExpense = useMemo(() => {
        return state.transactions
            .filter((txn) => txn.type === 'expense')
            .reduce((sum, txn) => sum + txn.amount, 0);
    }, [state.transactions]);

    // Filtered and sorted transactions
    const filteredTransactions = useMemo(() => {
        return state.transactions
            .filter((txn) => {
                if (typeFilter !== 'all' && txn.type !== typeFilter) return false;
                if (accountFilter !== 'all' && txn.accountId !== accountFilter) return false;
                if (categoryFilter !== 'all' && txn.category !== categoryFilter) return false;

                if (searchQuery.trim()) {
                    const q = searchQuery.toLowerCase();
                    const descMatch = txn.description.toLowerCase().includes(q);
                    const amountMatch = txn.amount.toString().includes(q);
                    const catMatch = txn.category.toLowerCase().includes(q);
                    return descMatch || amountMatch || catMatch;
                }

                return true;
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [state.transactions, typeFilter, accountFilter, categoryFilter, searchQuery]);

    const deletingTxn = deletingTransactionId 
        ? state.transactions.find((t) => t.id === deletingTransactionId) 
        : null;
    const deletingTxnCategory = deletingTxn 
        ? DEFAULT_CATEGORIES.find((cat) => cat.id === deletingTxn.category) 
        : null;
    const deletingTxnAccount = deletingTxn 
        ? state.accounts.find((acc) => acc.id === deletingTxn.accountId) 
        : null;

    const netFlow = totalIncome - totalExpense;
    const hasActiveFilters = searchQuery.trim() !== '' || typeFilter !== 'all' || accountFilter !== 'all' || categoryFilter !== 'all';

    const handleResetFilters = () => {
        setSearchQuery('');
        setTypeFilter('all');
        setAccountFilter('all');
        setCategoryFilter('all');
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight text-foreground">
                        Transaction Ledger
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        Track, search, and audit your inflows and outflows with natural language logging.
                    </p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="gap-2 self-start sm:self-auto shadow-md">
                    <Plus className="w-4 h-4" />
                    <span>New Transaction</span>
                    <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-primary-foreground/20 text-[10px] font-mono">
                        N
                    </kbd>
                </Button>
            </div>

            {/* Fluid Executive Telemetry Ribbon (De-boxed) */}
            <div className="rounded-2xl glass-card border border-border/70 p-5">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 divide-y lg:divide-y-0 lg:divide-x divide-border/40">
                    {/* Inflow */}
                    <div className="space-y-1 pr-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                            Total Inflows
                        </span>
                        <p className="text-xl sm:text-2xl font-bold income-text tabular-nums font-mono">
                            +${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>

                    {/* Outflow */}
                    <div className="space-y-1 pt-4 lg:pt-0 lg:px-4">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                            Total Outflows
                        </span>
                        <p className="text-xl sm:text-2xl font-bold expense-text tabular-nums font-mono">
                            -${totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>

                    {/* Net Flow */}
                    <div className="space-y-1 pt-4 lg:pt-0 lg:px-4">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                            Net Cash Flow
                        </span>
                        <p className={`text-xl sm:text-2xl font-bold tabular-nums font-mono ${
                            netFlow >= 0 ? 'income-text' : 'expense-text'
                        }`}>
                            {netFlow >= 0 ? '+' : '-'}${Math.abs(netFlow).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>

                    {/* Record Scope */}
                    <div className="space-y-1 pt-4 lg:pt-0 lg:pl-4">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                            Record Scope
                        </span>
                        <p className="text-xl sm:text-2xl font-bold text-foreground font-mono">
                            {filteredTransactions.length} <span className="text-xs text-muted-foreground font-normal">of {state.transactions.length}</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Unified Ledger Container with Integrated Command Toolbar */}
            <div className="rounded-2xl glass-card border border-border/70 overflow-hidden shadow-xs">
                {/* Integrated Command Toolbar */}
                <div className="p-4 border-b border-border/50 bg-secondary/15 space-y-2.5">
                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search payees, memos, accounts, or amounts..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-9 pl-10 pr-8 rounded-xl border border-border/60 bg-secondary/40 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-border focus:ring-1 focus:ring-ring transition-all"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 cursor-pointer"
                                    title="Clear search"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Type Segment Filter */}
                        <div className="flex bg-secondary/50 p-1 rounded-xl border border-border/50 shrink-0 select-none">
                            {[
                                { id: 'all', label: 'All' },
                                { id: 'income', label: 'Inflows' },
                                { id: 'expense', label: 'Outflows' },
                            ].map((type) => (
                                <button
                                    key={type.id}
                                    onClick={() => setTypeFilter(type.id as any)}
                                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                                        typeFilter === type.id
                                            ? 'bg-card text-foreground shadow-xs'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Secondary Filter Row: Account, Category & Reset */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1.5 text-muted-foreground font-medium text-xs mr-1">
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                                <span>Filters:</span>
                            </div>

                            <select
                                value={accountFilter}
                                onChange={(e) => setAccountFilter(e.target.value)}
                                className="h-7 px-2.5 rounded-lg bg-secondary/50 border border-border/50 text-foreground text-xs outline-none cursor-pointer hover:bg-secondary/70 transition-colors"
                            >
                                <option value="all">All Accounts ({state.accounts.length})</option>
                                {state.accounts.map((acc) => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.name}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="h-7 px-2.5 rounded-lg bg-secondary/50 border border-border/50 text-foreground text-xs outline-none cursor-pointer hover:bg-secondary/70 transition-colors"
                            >
                                <option value="all">All Categories</option>
                                {DEFAULT_CATEGORIES.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>

                            {hasActiveFilters && (
                                <button
                                    onClick={handleResetFilters}
                                    className="h-7 px-2.5 rounded-lg bg-secondary/80 hover:bg-secondary text-primary text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-border/60"
                                    title="Reset all filters"
                                >
                                    <RotateCcw className="w-3 h-3" />
                                    <span>Reset</span>
                                </button>
                            )}
                        </div>

                        <span className="text-[11px] font-mono text-muted-foreground">
                            Showing {filteredTransactions.length} of {state.transactions.length} records
                        </span>
                    </div>
                </div>

                {/* Ledger Table Rows */}
                {filteredTransactions.length > 0 ? (
                    <>
                    {/* Desktop Table Header */}
                    <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-secondary/40 border-b border-border/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground select-none">
                        <div className="col-span-2">Date</div>
                        <div className="col-span-4">Payee & Memo</div>
                        <div className="col-span-2">Category</div>
                        <div className="col-span-2">Ledger Account</div>
                        <div className="col-span-2 text-right">Amount</div>
                    </div>

                    {/* Rows */}
                    <div className="divide-y divide-border/30">
                        {filteredTransactions.map((txn) => {
                            const category = DEFAULT_CATEGORIES.find((cat) => cat.id === txn.category);
                            const account = state.accounts.find((acc) => acc.id === txn.accountId);
                            const dateObj = new Date(txn.date);

                            return (
                                <div
                                    key={txn.id}
                                    className="group flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-4 px-4 sm:px-6 py-3.5 hover:bg-secondary/35 transition-colors items-start md:items-center relative"
                                >
                                    {/* Date Column */}
                                    <div className="col-span-2 text-xs font-mono text-muted-foreground hidden md:block">
                                        {dateObj.toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                        })}
                                    </div>

                                    {/* Payee / Description Column */}
                                    <div className="col-span-4 flex items-center gap-3 min-w-0 w-full md:w-auto">
                                        <div className="w-9 h-9 rounded-xl bg-secondary/70 border border-border/40 flex items-center justify-center shrink-0 md:hidden text-foreground/80">
                                            <FinanceIcon id={txn.category} size={16} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                                                {txn.description}
                                            </p>
                                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground md:hidden mt-0.5">
                                                <span>{dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                                <span>•</span>
                                                <span>{account?.name || 'Account'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Category Column */}
                                    <div className="col-span-2 hidden md:flex items-center gap-1.5 min-w-0">
                                        <div className="w-6 h-6 rounded-lg bg-secondary/80 border border-border/40 flex items-center justify-center shrink-0 text-foreground/80">
                                            <FinanceIcon id={txn.category} size={13} />
                                        </div>
                                        <span className="text-xs font-medium text-foreground/85 truncate">
                                            {category?.name || txn.category}
                                        </span>
                                    </div>

                                    {/* Linked Account Column */}
                                    <div className="col-span-2 hidden md:flex items-center gap-2 min-w-0">
                                        <div 
                                            className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 border border-border/40 overflow-hidden"
                                            style={{ backgroundColor: `${account?.color || '#3b82f6'}15` }}
                                        >
                                            <FinanceIcon id={account?.icon || account?.type || 'bank'} size={14} />
                                        </div>
                                        <span className="text-xs text-muted-foreground truncate font-medium">
                                            {account?.name || 'Ledger'}
                                        </span>
                                    </div>

                                    {/* Amount and Action Column */}
                                    <div className="col-span-2 flex items-center justify-between md:justify-end gap-3 w-full md:w-auto mt-1 md:mt-0 pt-1 md:pt-0 border-t md:border-t-0 border-border/30">
                                        <div className="md:hidden flex items-center gap-1.5">
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary border border-border/40 text-muted-foreground">
                                                {category?.name || txn.category}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className={`font-mono font-bold text-sm sm:text-base tabular-nums ${
                                                txn.type === 'income' ? 'income-text' : 'expense-text'
                                            }`}>
                                                {txn.type === 'income' ? '+' : '-'}${txn.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>

                                            <button
                                                onClick={() => setDeletingTransactionId(txn.id)}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
                                                title="Delete Record"
                                                aria-label="Delete Record"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    </>
                ) : (
                    <div className="p-16 text-center space-y-4">
                        <div className="w-14 h-14 rounded-2xl bg-secondary/70 flex items-center justify-center mx-auto text-muted-foreground">
                            <FileText className="w-7 h-7" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-base font-bold font-heading text-foreground">
                                {hasActiveFilters ? 'No Matching Records' : 'No Transactions Recorded'}
                            </h3>
                            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                                {hasActiveFilters 
                                    ? 'Try refining your search terms or clearing active filters.'
                                    : 'Start auditing your cash flow by logging your first transaction.'}
                            </p>
                        </div>
                        {hasActiveFilters ? (
                            <Button variant="outline" onClick={handleResetFilters} className="gap-2">
                                <RotateCcw className="w-4 h-4" /> Reset Filters
                            </Button>
                        ) : (
                            <Button onClick={() => setIsModalOpen(true)} className="gap-2">
                                <Plus className="w-4 h-4" /> Add Transaction
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Quick Log Modal */}
            <Modal
                open={isModalOpen}
                onOpenChange={handleClose}
                title="Log Transaction"
                description="Use natural language or customize manually."
                size="lg"
                footer={
                    <div className="flex items-center justify-between w-full">
                        <span className="text-[11px] text-muted-foreground hidden sm:inline-flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 rounded bg-secondary font-mono text-[10px] border border-border/60">Enter</kbd> to submit
                        </span>
                        <div className="flex gap-2 ml-auto">
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
                            <div className="text-4xl font-extrabold tracking-tight text-center select-all tabular-nums">
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
                                <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/80">
                                    Natural Language Entry
                                </label>
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
                                <div className="bg-secondary/50 border border-border/50 p-3 rounded-xl text-xs whitespace-pre-line text-muted-foreground leading-relaxed animate-fade-in">
                                    {getFormatGuide()}
                                </div>
                            )}

                            <Input
                                ref={quickLogInputRef}
                                placeholder='e.g., "50 dinner yesterday" or "+4500 salary on 1st"'
                                value={quickLogInput}
                                onChange={(e) => handleQuickLogChange(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && quickLogPreview.isValid) {
                                        handleQuickLogSubmit();
                                    }
                                }}
                                className="h-11 font-medium"
                            />

                            {/* Quick Sample Prompts */}
                            <div className="flex flex-wrap gap-1.5 pt-1">
                                {[
                                    '12 coffee today',
                                    '85 groceries',
                                    '+3500 salary',
                                ].map((sample) => (
                                    <button
                                        key={sample}
                                        type="button"
                                        onClick={() => handleQuickLogChange(sample)}
                                        className="text-[10px] px-2 py-0.5 rounded-md bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors cursor-pointer"
                                    >
                                        &quot;{sample}&quot;
                                    </button>
                                ))}
                            </div>
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

                        {/* Interactive Overrides: Account & Date */}
                        <div className="grid grid-cols-2 gap-4">
                            <Select
                                label="Account"
                                value={formData.accountId}
                                onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                                options={state.accounts.map((acc) => ({ value: acc.id, label: acc.name }))}
                            />

                            <Input
                                label="Date"
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Right Column: Description & Visual Category Selector Grid */}
                    <div className="space-y-4 border-t md:border-t-0 md:border-l border-border/45 pt-4 md:pt-0 md:pl-6 flex flex-col justify-between">
                        {/* Custom Parsed Description Display Tile */}
                        <div className="flex flex-col p-4 bg-secondary/30 rounded-2xl border border-border/40 min-h-[76px] justify-center relative overflow-hidden transition-all duration-200">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 select-none">
                                Parsed Memo
                            </span>
                            <div className="flex items-center gap-2">
                                <FileText className={`w-4 h-4 shrink-0 transition-colors ${formData.description ? 'text-primary' : 'text-muted-foreground/45'}`} />
                                <span className={`text-sm font-semibold truncate ${formData.description ? 'text-foreground' : 'text-muted-foreground/40 italic font-normal'}`}>
                                    {formData.description || 'Memo automatically extracted from input'}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2 flex-1 flex flex-col justify-start">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Category Selection ({formData.type === 'income' ? 'Income' : 'Expense'})
                            </label>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 max-h-[220px] overflow-y-auto pr-1">
                                {(formData.type === 'income' ? incomeCategories : expenseCategories).map((cat) => {
                                    const isSelected = formData.category === cat.id;
                                    return (
                                        <button
                                            key={cat.id}
                                            onClick={() => setFormData({ ...formData, category: cat.id })}
                                            className={`p-2.5 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all border cursor-pointer select-none text-center h-[72px] ${
                                                isSelected
                                                    ? 'bg-primary/15 border-primary text-primary font-bold scale-102 ring-2 ring-primary/20 shadow-sm'
                                                    : 'bg-secondary/40 border-border/50 hover:bg-secondary/80 text-muted-foreground hover:text-foreground hover:scale-102'
                                            }`}
                                            type="button"
                                        >
                                            <FinanceIcon id={cat.id} size={20} className={isSelected ? 'text-primary' : 'text-foreground/75'} />
                                            <span className="text-[10px] tracking-tight font-medium truncate w-full">{cat.name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Delete Transaction Modal */}
            <Modal
                open={!!deletingTransactionId}
                onOpenChange={(open) => {
                    if (!open) setDeletingTransactionId(null);
                }}
                title="Delete Transaction"
                size="md"
                footer={
                    <div className="flex gap-2 justify-end w-full">
                        <Button variant="ghost" onClick={() => setDeletingTransactionId(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (deletingTransactionId) {
                                    deleteTransaction(deletingTransactionId);
                                    setDeletingTransactionId(null);
                                }
                            }}
                        >
                            Delete Record
                        </Button>
                    </div>
                }
            >
                {deletingTxn && (
                    <div className="space-y-4">
                        <p className="text-sm text-foreground leading-relaxed">
                            Are you sure you want to delete this transaction? This action will reverse its balance effect on the linked account.
                        </p>
                        <div className="p-4 bg-secondary/40 rounded-2xl border border-border/50 flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-secondary/70 border border-border/40 flex items-center justify-center shrink-0 text-foreground/80">
                                    <FinanceIcon id={deletingTxn.category} size={18} />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-semibold text-sm text-foreground truncate">{deletingTxn.description}</p>
                                    <p className="text-xs text-muted-foreground">{deletingTxnAccount?.name}</p>
                                </div>
                            </div>
                            <span className={`font-mono font-bold text-sm tabular-nums ${deletingTxn.type === 'income' ? 'income-text' : 'expense-text'}`}>
                                {deletingTxn.type === 'income' ? '+' : '-'}${deletingTxn.amount.toFixed(2)}
                            </span>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
