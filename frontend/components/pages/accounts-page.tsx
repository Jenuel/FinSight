'use client';

import { useState } from 'react';
import { Plus, Edit2, Trash2, Check, CreditCard, ShieldAlert, Sparkles, SlidersHorizontal, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useFinance } from '@/lib/context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button-custom';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { ACCOUNT_COLORS } from '@/lib/types';
import { FinanceIcon, ACCOUNT_ICON_OPTIONS } from '@/components/ui/finance-icon';
import { 
  FINANCIAL_INSTITUTIONS, 
  detectAccountDetails, 
  FinancialInstitution 
} from '@/lib/institution-detector';

const WALLET_INSTITUTIONS = FINANCIAL_INSTITUTIONS.filter(i => i.category === 'wallet');
const DIGITAL_BANKS = FINANCIAL_INSTITUTIONS.filter(i => i.category === 'digital-bank');
const PH_BANKS = FINANCIAL_INSTITUTIONS.filter(i => i.category === 'ph-bank');

const formatWithCommas = (value: string) => {
    const cleanValue = value.replace(/[^\d.]/g, '');
    const parts = cleanValue.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    if (parts[1] !== undefined) {
        parts[1] = parts[1].substring(0, 2);
    }
    return parts.join('.');
};

export function AccountsPage() {
    const { state, addAccount, updateAccount, deleteAccount, addTransaction } = useFinance();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [balanceInput, setBalanceInput] = useState('');
    const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null);
    const [confirmNameInput, setConfirmNameInput] = useState('');
    const [reconciliationData, setReconciliationData] = useState<{ diff: number, originalBalance: number, newBalance: number, submitData: any } | null>(null);
    const [detectedBadge, setDetectedBadge] = useState<string | null>(null);
    const [iconTab, setIconTab] = useState<'wallets' | 'digital' | 'ph-banks' | 'generic'>('wallets');
    const [formData, setFormData] = useState({
        name: '',
        type: 'checking' as 'checking' | 'savings' | 'credit' | 'cash' | 'ewallet',
        color: ACCOUNT_COLORS[0],
        icon: 'bank',
        balance: 0,
    });

    const handleTypeChange = (type: 'checking' | 'savings' | 'credit' | 'cash' | 'ewallet') => {
        let defaultIcon = 'bank';
        if (type === 'savings') defaultIcon = 'savings';
        if (type === 'credit') defaultIcon = 'card';
        if (type === 'cash') defaultIcon = 'cash';
        if (type === 'ewallet') defaultIcon = 'wallet';

        setFormData((prev) => ({
            ...prev,
            type,
            icon: defaultIcon
        }));
    };

    const handleNameChange = (val: string) => {
        const detection = detectAccountDetails(val);
        if (detection.detected) {
            setFormData((prev) => ({
                ...prev,
                name: val,
                type: detection.suggestedType || prev.type,
                icon: detection.suggestedIcon || prev.icon,
                color: detection.suggestedColor || prev.color,
            }));
            setDetectedBadge(detection.reason || 'Auto-detected institution');

            if (detection.institution) {
                if (detection.institution.category === 'wallet') setIconTab('wallets');
                else if (detection.institution.category === 'digital-bank') setIconTab('digital');
                else if (detection.institution.category === 'ph-bank') setIconTab('ph-banks');
            }
        } else {
            setFormData((prev) => ({ ...prev, name: val }));
            setDetectedBadge(null);
        }
    };

    const handleSelectInstitution = (inst: FinancialInstitution) => {
        setFormData((prev) => ({
            ...prev,
            icon: inst.id,
            color: inst.brandColor,
            type: inst.defaultType,
            name: prev.name.trim() === '' ? inst.shortName : prev.name
        }));
        setDetectedBadge(`Selected ${inst.name} (${inst.defaultType.toUpperCase()})`);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) return;

        const numericBalance = parseFloat(balanceInput.replace(/,/g, '')) || 0;
        const submitData = {
            ...formData,
            balance: numericBalance,
        };

        if (editingId) {
            const originalAccount = state.accounts.find((a) => a.id === editingId);
            if (originalAccount && originalAccount.balance !== numericBalance) {
                const diff = numericBalance - originalAccount.balance;
                setReconciliationData({
                    diff,
                    originalBalance: originalAccount.balance,
                    newBalance: numericBalance,
                    submitData,
                });
                return;
            }
            await updateAccount(editingId, submitData);
            setEditingId(null);
        } else {
            await addAccount({
                ...submitData,
                currency: 'USD',
            });
        }

        setFormData({ name: '', type: 'checking', color: ACCOUNT_COLORS[0], icon: 'bank', balance: 0 });
        setBalanceInput('');
        setIsModalOpen(false);
    };

    const handleConfirmReconciliation = async () => {
        if (editingId && reconciliationData) {
            await addTransaction({
                accountId: editingId,
                type: reconciliationData.diff > 0 ? 'income' : 'expense',
                category: reconciliationData.diff > 0 ? 'other-income' : 'other-expense',
                amount: Math.abs(reconciliationData.diff),
                description: 'Reconciled balance',
                date: new Date().toISOString().split('T')[0],
                tags: ['reconciliation']
            });
            await updateAccount(editingId, reconciliationData.submitData);
            setEditingId(null);
            setReconciliationData(null);
            setFormData({ name: '', type: 'checking', color: ACCOUNT_COLORS[0], icon: 'bank', balance: 0 });
            setBalanceInput('');
            setIsModalOpen(false);
        }
    };

    const handleEdit = (id: string) => {
        const account = state.accounts.find((acc) => acc.id === id);
        if (account) {
            setFormData({
                name: account.name,
                type: account.type,
                color: account.color,
                icon: account.icon || 'bank',
                balance: account.balance,
            });
            setBalanceInput(account.balance === 0 ? '' : formatWithCommas(account.balance.toString()));
            setEditingId(id);
            setIsModalOpen(true);
        }
    };

    const handleClose = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setFormData({ name: '', type: 'checking', color: ACCOUNT_COLORS[0], icon: 'bank', balance: 0 });
        setBalanceInput('');
        setDetectedBadge(null);
    };

    const totalBalance = state.accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const totalPositiveBalance = state.accounts
        .filter(a => a.balance > 0)
        .reduce((sum, a) => sum + a.balance, 0);
    const totalAssets = state.accounts
        .filter(a => a.balance > 0)
        .reduce((sum, a) => sum + a.balance, 0);
    const totalLiabilities = state.accounts
        .filter(a => a.balance < 0)
        .reduce((sum, a) => sum + Math.abs(a.balance), 0);

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight text-foreground">
                        Accounts & Ledgers
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        Manage your bank accounts, credit facilities, and liquid reserves with institutional precision.
                    </p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="gap-2 self-start sm:self-auto shadow-md">
                    <Plus className="w-4 h-4" />
                    <span>New Account</span>
                </Button>
            </div>

            {/* Open Executive Net Worth Hero (De-boxed) */}
            {state.accounts.length > 0 && (
                <div className="py-2 pb-6 border-b border-border/50">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        {/* Left: Consolidated Net Worth with Asset & Liability Summary */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase font-heading">
                                    Consolidated Net Worth
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-secondary/80 text-muted-foreground border border-border/60">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    LIVE
                                </span>
                            </div>
                            <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-heading tracking-tight text-foreground font-mono tabular-nums">
                                ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="flex items-center gap-4 text-xs font-mono pt-1">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-muted-foreground uppercase text-[10px] tracking-wider font-sans">Assets</span>
                                    <span className="income-text font-semibold">
                                        +${totalAssets.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <span className="text-border/80">•</span>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-muted-foreground uppercase text-[10px] tracking-wider font-sans">Liabilities</span>
                                    <span className="expense-text font-semibold">
                                        {totalLiabilities > 0 ? `-$${totalLiabilities.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'}
                                    </span>
                                </div>
                                <span className="text-border/80">•</span>
                                <span className="text-muted-foreground">
                                    {state.accounts.length} {state.accounts.length === 1 ? 'ledger' : 'ledgers'}
                                </span>
                            </div>
                        </div>

                        {/* Right: Category Breakdown with Balanced, Legible Typography */}
                        <div className="flex flex-wrap items-center gap-6 sm:gap-8 lg:justify-end">
                            {['checking', 'savings', 'credit', 'ewallet', 'cash'].map((accType) => {
                                const count = state.accounts.filter(a => a.type === accType).length;
                                if (count === 0) return null;
                                const subtotal = state.accounts
                                    .filter(a => a.type === accType)
                                    .reduce((acc, a) => acc + a.balance, 0);
                                const displayName = accType === 'ewallet' 
                                    ? 'Digital Wallet' 
                                    : accType.charAt(0).toUpperCase() + accType.slice(1);

                                return (
                                    <div key={accType} className="space-y-1">
                                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                                            {displayName}
                                        </span>
                                        <span className={`text-base sm:text-lg font-bold font-mono tabular-nums block ${
                                            subtotal < 0 ? 'expense-text' : 'text-foreground'
                                        }`}>
                                            {subtotal < 0 ? '-' : ''}${Math.abs(subtotal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Modernist Ledger Cards Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {state.accounts.map((account) => {
                    const cardColor = account.color || '#10b981';
                    const portfolioShare = totalPositiveBalance > 0 && account.balance > 0
                        ? Math.round((account.balance / totalPositiveBalance) * 100)
                        : 0;

                    return (
                        <div
                            key={account.id}
                            className="group relative rounded-2xl p-6 glass-card border border-border/60 hover:border-border transition-all duration-200 flex flex-col justify-between h-[230px] overflow-hidden"
                        >
                            {/* Refined top accent indicator */}
                            <div 
                                className="absolute top-0 left-0 right-0 h-[3px] transition-all group-hover:h-[4px]"
                                style={{ backgroundColor: cardColor }}
                            />

                            {/* Card Top: Identifier, Type, and Quick Actions */}
                            <div className="relative z-10 flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div 
                                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-border/50 shadow-xs transition-transform group-hover:scale-105"
                                        style={{ 
                                            backgroundColor: `${cardColor}15`, 
                                            color: cardColor 
                                        }}
                                    >
                                        <FinanceIcon id={account.icon || account.type} size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-base font-bold font-heading text-foreground tracking-tight truncate group-hover:text-primary transition-colors">
                                            {account.name}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                                {account.type}
                                            </span>
                                            <span className="text-[11px] text-muted-foreground/60">•</span>
                                            <span className="text-[11px] font-mono text-muted-foreground">
                                                {account.currency || 'USD'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions (Edit / Delete) */}
                                <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleEdit(account.id)}
                                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                                        title="Edit Account / Reconcile Balance"
                                        aria-label="Edit Account / Reconcile Balance"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => setDeletingAccountId(account.id)}
                                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                                        title="Delete Account"
                                        aria-label="Delete Account"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            {/* Card Center: Available / Outstanding Balance */}
                            <div className="relative z-10 my-auto pt-2">
                                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                                    {account.type === 'credit' ? 'Outstanding Balance' : 'Available Balance'}
                                </span>
                                <div className="flex items-baseline gap-1">
                                    <span className={`text-2xl sm:text-3xl font-extrabold font-heading font-mono tracking-tight tabular-nums ${
                                        account.balance < 0 ? 'expense-text' : 'text-foreground'
                                    }`}>
                                        {account.balance < 0 ? '-' : ''}${Math.abs(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>

                            {/* Card Footer: Portfolio Share & Progress Allocation */}
                            <div className="relative z-10 pt-3 border-t border-border/40 space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground text-[11px]">
                                        {account.type === 'credit' ? 'Liability Status' : 'Portfolio Weight'}
                                    </span>
                                    <span className="font-mono text-[11px] font-semibold text-foreground tabular-nums">
                                        {account.type === 'credit' ? 'Revolving' : `${portfolioShare}%`}
                                    </span>
                                </div>
                                <div className="w-full bg-secondary/80 rounded-full h-1.5 overflow-hidden">
                                    <div 
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{ 
                                            width: account.type === 'credit' ? '100%' : `${Math.min(100, Math.max(2, portfolioShare))}%`,
                                            backgroundColor: cardColor
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {state.accounts.length === 0 && (
                <div className="p-16 rounded-3xl glass-card border border-border/70 text-center space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mx-auto text-muted-foreground">
                        <CreditCard className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-base font-bold text-foreground">No Accounts Configured</h3>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                            Link your checking, savings, or investment accounts to start tracking liquidity.
                        </p>
                    </div>
                    <Button onClick={() => setIsModalOpen(true)} className="gap-2">
                        <Plus className="w-4 h-4" /> Create First Account
                    </Button>
                </div>
            )}

            {/* Add / Edit Account Modal */}
            <Modal
                open={isModalOpen}
                onOpenChange={handleClose}
                title={editingId ? 'Edit Account Details' : 'Configure New Account'}
                description={editingId ? 'Update your account name, type, or current balance.' : 'Add an account to your personal finance dashboard.'}
                size="lg"
                footer={
                    <div className="flex gap-2 justify-end w-full">
                        <Button variant="ghost" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit}>
                            {editingId ? 'Save Changes' : 'Create Account'}
                        </Button>
                    </div>
                }
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Top Balance Display */}
                    <div className="flex flex-col items-center justify-center p-6 bg-secondary/30 rounded-2xl border border-border/50 text-center">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                            {editingId ? 'Current Reconciled Balance' : 'Initial Starting Balance'}
                        </span>
                        <div className="flex items-center justify-center w-full">
                            <span className="text-2xl font-bold text-muted-foreground mr-1">$</span>
                            <input
                                type="text"
                                placeholder="0.00"
                                value={balanceInput}
                                onChange={(e) => {
                                    const formatted = formatWithCommas(e.target.value);
                                    setBalanceInput(formatted);
                                }}
                                className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground bg-transparent border-none focus:outline-none w-full max-w-[280px] text-center select-all placeholder:text-muted-foreground/30 tabular-nums"
                            />
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Input
                                label="Account Name"
                                placeholder="e.g., Wise Wallet, BDO Savings, GCash..."
                                value={formData.name}
                                onChange={(e) => handleNameChange(e.target.value)}
                                required
                            />
                            {detectedBadge && (
                                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg animate-fade-in mt-1">
                                    <Sparkles className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                                    <span className="font-medium truncate">{detectedBadge}</span>
                                </div>
                            )}
                        </div>

                        <Select
                            label="Account Type"
                            value={formData.type}
                            onChange={(e) => handleTypeChange(e.target.value as any)}
                            options={[
                                { value: 'checking', label: 'Checking Account' },
                                { value: 'savings', label: 'High-Yield Savings' },
                                { value: 'credit', label: 'Credit Card' },
                                { value: 'cash', label: 'Physical Cash' },
                                { value: 'ewallet', label: 'E-Wallet / Digital' },
                            ]}
                        />
                    </div>

                    {/* Color and Icon Selectors */}
                    <div className="space-y-4 pt-2 border-t border-border/40">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Card Theme Accent
                                </label>
                                <span className="text-[11px] font-mono text-muted-foreground uppercase">{formData.color}</span>
                            </div>
                            <div className="flex gap-2.5 flex-wrap pt-1 items-center">
                                {/* Custom active brand color if not in default palette */}
                                {!ACCOUNT_COLORS.includes(formData.color) && (
                                    <button
                                        type="button"
                                        className="w-8 h-8 rounded-full ring-2 ring-primary ring-offset-2 ring-offset-background scale-110 shadow-md flex items-center justify-center cursor-pointer border border-border"
                                        style={{ backgroundColor: formData.color }}
                                        title="Active Brand Color"
                                    >
                                        <Check className="w-3.5 h-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
                                    </button>
                                )}
                                {ACCOUNT_COLORS.map((color) => (
                                    <button
                                        key={color}
                                        onClick={() => setFormData({ ...formData, color })}
                                        className={`w-8 h-8 rounded-full transition-all flex items-center justify-center cursor-pointer border border-black/10 dark:border-white/10 ${
                                            formData.color === color 
                                                ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110 shadow-md' 
                                                : 'hover:scale-105 opacity-80 hover:opacity-100'
                                        }`}
                                        style={{ backgroundColor: color }}
                                        type="button"
                                        aria-label={`Select color ${color}`}
                                    >
                                        {formData.color === color && (
                                            <Check className="w-3.5 h-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Categorized Institution and Icon Selector */}
                        <div className="space-y-2.5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Account Logo & Emblem
                                </label>
                                
                                {/* Tabs */}
                                <div className="flex bg-secondary/50 p-0.5 rounded-xl border border-border/50 self-start sm:self-auto">
                                    {[
                                        { id: 'wallets', label: 'Wallets & Global' },
                                        { id: 'digital', label: 'Digital Banks' },
                                        { id: 'ph-banks', label: 'PH Banks' },
                                        { id: 'generic', label: 'Generic' },
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => setIconTab(tab.id as any)}
                                            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                                                iconTab === tab.id
                                                    ? 'bg-card text-foreground shadow-xs'
                                                    : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Logos Grid */}
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-1 max-h-[190px] overflow-y-auto pr-1">
                                {iconTab === 'wallets' && WALLET_INSTITUTIONS.map((inst) => {
                                    const isSelected = formData.icon.toLowerCase() === inst.id.toLowerCase();
                                    return (
                                        <button
                                            key={inst.id}
                                            type="button"
                                            onClick={() => handleSelectInstitution(inst)}
                                            className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1.5 border transition-all cursor-pointer h-16 ${
                                                isSelected 
                                                    ? 'bg-primary/15 border-primary shadow-xs ring-2 ring-primary/25 scale-102 font-bold' 
                                                    : 'bg-secondary/40 border-border/50 hover:bg-secondary/80 hover:scale-102'
                                            }`}
                                            title={inst.name}
                                        >
                                            <FinanceIcon id={inst.id} size={22} />
                                            <span className="text-[10px] font-medium text-foreground truncate w-full text-center">{inst.shortName}</span>
                                        </button>
                                    );
                                })}

                                {iconTab === 'digital' && DIGITAL_BANKS.map((inst) => {
                                    const isSelected = formData.icon.toLowerCase() === inst.id.toLowerCase();
                                    return (
                                        <button
                                            key={inst.id}
                                            type="button"
                                            onClick={() => handleSelectInstitution(inst)}
                                            className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1.5 border transition-all cursor-pointer h-16 ${
                                                isSelected 
                                                    ? 'bg-primary/15 border-primary shadow-xs ring-2 ring-primary/25 scale-102 font-bold' 
                                                    : 'bg-secondary/40 border-border/50 hover:bg-secondary/80 hover:scale-102'
                                            }`}
                                            title={inst.name}
                                        >
                                            <FinanceIcon id={inst.id} size={22} />
                                            <span className="text-[10px] font-medium text-foreground truncate w-full text-center">{inst.shortName}</span>
                                        </button>
                                    );
                                })}

                                {iconTab === 'ph-banks' && PH_BANKS.map((inst) => {
                                    const isSelected = formData.icon.toLowerCase() === inst.id.toLowerCase();
                                    return (
                                        <button
                                            key={inst.id}
                                            type="button"
                                            onClick={() => handleSelectInstitution(inst)}
                                            className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1.5 border transition-all cursor-pointer h-16 ${
                                                isSelected 
                                                    ? 'bg-primary/15 border-primary shadow-xs ring-2 ring-primary/25 scale-102 font-bold' 
                                                    : 'bg-secondary/40 border-border/50 hover:bg-secondary/80 hover:scale-102'
                                            }`}
                                            title={inst.name}
                                        >
                                            <FinanceIcon id={inst.id} size={22} />
                                            <span className="text-[10px] font-medium text-foreground truncate w-full text-center">{inst.shortName}</span>
                                        </button>
                                    );
                                })}

                                {iconTab === 'generic' && ACCOUNT_ICON_OPTIONS.map((opt) => {
                                    const isSelected = formData.icon.toLowerCase() === opt.id.toLowerCase();
                                    return (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, icon: opt.id })}
                                            className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1.5 border transition-all cursor-pointer h-16 ${
                                                isSelected 
                                                    ? 'bg-primary/15 border-primary shadow-xs ring-2 ring-primary/25 scale-102 font-bold' 
                                                    : 'bg-secondary/40 border-border/50 hover:bg-secondary/80 hover:scale-102'
                                            }`}
                                            title={opt.label}
                                        >
                                            <FinanceIcon id={opt.id} size={20} className="text-foreground" />
                                            <span className="text-[10px] font-medium text-foreground truncate w-full text-center">{opt.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Reconciliation Modal */}
            <Modal
                open={!!reconciliationData}
                onOpenChange={(open) => !open && setReconciliationData(null)}
                title="Balance Reconciliation"
                description="Review and confirm automatic ledger adjustment."
                size="md"
                footer={
                    <div className="flex gap-2 justify-end w-full">
                        <Button variant="ghost" onClick={() => setReconciliationData(null)}>
                            Cancel
                        </Button>
                        <Button onClick={handleConfirmReconciliation}>
                            Confirm Reconciliation
                        </Button>
                    </div>
                }
            >
                {reconciliationData && (
                    <div className="space-y-4">
                        <div className="p-4 bg-secondary/40 rounded-2xl border border-border/50 space-y-2.5">
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Original Ledger Balance:</span>
                                <span className="font-mono font-bold text-foreground">
                                    ${reconciliationData.originalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">New Stated Balance:</span>
                                <span className="font-mono font-bold text-foreground">
                                    ${reconciliationData.newBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm border-t border-border/40 pt-2 font-bold">
                                <span className="text-foreground">Reconciliation Diff:</span>
                                <span className={reconciliationData.diff > 0 ? 'text-emerald-500' : 'text-destructive'}>
                                    {reconciliationData.diff > 0 ? '+' : '-'}${Math.abs(reconciliationData.diff).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            FinSight will generate a balanced audit adjustment transaction to keep your financial statements mathematically accurate.
                        </p>
                    </div>
                )}
            </Modal>

            {/* Delete Account Modal */}
            <Modal
                open={!!deletingAccountId}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeletingAccountId(null);
                        setConfirmNameInput('');
                    }
                }}
                title="Delete Account"
                size="md"
                footer={
                    <div className="flex gap-2 justify-end w-full">
                        <Button variant="ghost" onClick={() => {
                            setDeletingAccountId(null);
                            setConfirmNameInput('');
                        }}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={confirmNameInput !== (state.accounts.find((acc) => acc.id === deletingAccountId)?.name || '')}
                            onClick={() => {
                                if (deletingAccountId) {
                                    deleteAccount(deletingAccountId);
                                    setDeletingAccountId(null);
                                    setConfirmNameInput('');
                                }
                            }}
                        >
                            Confirm Deletion
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <div className="p-4 bg-destructive/10 text-destructive rounded-2xl border border-destructive/20 flex gap-3 items-start">
                        <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <h4 className="font-bold text-sm">Permanent Action</h4>
                            <p className="text-xs leading-relaxed text-destructive/90">
                                This will permanently remove{' '}
                                <strong className="underline">
                                    {state.accounts.find((acc) => acc.id === deletingAccountId)?.name}
                                </strong>{' '}
                                and all its historical transactions.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">
                            Type <strong className="text-foreground">{state.accounts.find((acc) => acc.id === deletingAccountId)?.name}</strong> to confirm:
                        </p>
                        <Input
                            placeholder="Enter exact account name"
                            value={confirmNameInput}
                            onChange={(e) => setConfirmNameInput(e.target.value)}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
}
