'use client';

import { useState } from 'react';
import { Plus, Edit2, Trash2, Check } from 'lucide-react';
import { useFinance } from '@/lib/context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button-custom';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { ACCOUNT_COLORS } from '@/lib/types';

const ACCOUNT_ICONS = ['🏦', '💳', '🐷', '💰', '💵', '📈', '💼', '🛡️', '🚀', '🏠', '🪙', '🔑'];

const formatWithCommas = (value: string) => {
    // Remove all non-digits except decimals
    const cleanValue = value.replace(/[^\d.]/g, '');
    // Split decimal parts
    const parts = cleanValue.split('.');
    // Add commas to the integer part
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    // Restrict to max 2 decimal places
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
    const [formData, setFormData] = useState({
        name: '',
        type: 'checking' as 'checking' | 'savings' | 'credit',
        color: ACCOUNT_COLORS[0],
        icon: '🏦',
        balance: 0,
    });

    const handleTypeChange = (type: 'checking' | 'savings' | 'credit') => {
        let defaultIcon = '🏦';
        if (type === 'savings') defaultIcon = '🐷';
        if (type === 'credit') defaultIcon = '💳';
 
        setFormData((prev) => ({
            ...prev,
            type,
            // Only overwrite if current icon was a default for the previous type
            icon: prev.icon === '🏦' || prev.icon === '🐷' || prev.icon === '💳' ? defaultIcon : prev.icon
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
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
            updateAccount(editingId, submitData);
            setEditingId(null);
        } else {
            addAccount({
                id: `acc-${Date.now()}`,
                ...submitData,
                currency: 'USD',
                createdAt: new Date().toISOString(),
            });
        }

        setFormData({ name: '', type: 'checking', color: ACCOUNT_COLORS[0], icon: '🏦', balance: 0 });
        setBalanceInput('');
        setIsModalOpen(false);
    };

    const handleConfirmReconciliation = () => {
        if (editingId && reconciliationData) {
            addTransaction({
                id: `txn-${Date.now()}`,
                accountId: editingId,
                type: reconciliationData.diff > 0 ? 'income' : 'expense',
                category: reconciliationData.diff > 0 ? 'other-income' : 'other-expense',
                amount: Math.abs(reconciliationData.diff),
                description: 'Reconciled balance',
                date: new Date().toISOString().split('T')[0],
                tags: ['reconciliation']
            });
            updateAccount(editingId, reconciliationData.submitData);
            setEditingId(null);
            setReconciliationData(null);
            setFormData({ name: '', type: 'checking', color: ACCOUNT_COLORS[0], icon: '🏦', balance: 0 });
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
                icon: account.icon || '🏦',
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
        setFormData({ name: '', type: 'checking', color: ACCOUNT_COLORS[0], icon: '🏦', balance: 0 });
        setBalanceInput('');
    };

    const totalBalance = state.accounts.reduce((sum, acc) => sum + acc.balance, 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Accounts</h1>
                    <p className="text-muted-foreground mt-1">Manage your financial accounts</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Account
                </Button>
            </div>

            {state.accounts.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Total Balance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold text-primary">
                            ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {state.accounts.map((account) => {
                    return (
                        <div
                            key={account.id}
                            style={{
                                borderTop: `3px solid ${account.color}`,
                            }}
                            className="group relative bg-card text-card-foreground border-2 border-neutral-300 dark:border-neutral-700 rounded-xl p-4 flex flex-col justify-between transition-all duration-200 hover:shadow-md select-none"
                        >
                            {/* Top header: Icon, Name, and Edit/Delete Actions */}
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <span className="text-xl shrink-0">{account.icon || '🏦'}</span>
                                    <div className="min-w-0">
                                        <h3 className="text-lg font-bold text-foreground tracking-tight truncate" title={account.name}>
                                            {account.name}
                                        </h3>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEdit(account.id);
                                        }}
                                        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                                        title="Edit Account"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDeletingAccountId(account.id);
                                        }}
                                        className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                                        title="Delete Account"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Main Display: Balance */}
                            <div className="mt-3">
                                <p className="text-3xl font-extrabold tracking-tight text-foreground">
                                    ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mt-0.5 capitalize">
                                    {account.type} account
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {state.accounts.length === 0 && (
                <Card>
                    <CardContent className="p-12 text-center">
                        <p className="text-muted-foreground mb-4">No accounts yet. Create one to get started!</p>
                        <Button onClick={() => setIsModalOpen(true)}>Create Account</Button>
                    </CardContent>
                </Card>
            )}

            <Modal
                open={isModalOpen}
                onOpenChange={handleClose}
                title={editingId ? 'Edit Account' : 'Add New Account'}
                size="lg"
                footer={
                    <div className="flex gap-2 justify-end">
                        <Button variant="ghost" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit}>
                            {editingId ? 'Update' : 'Create'} Account
                        </Button>
                    </div>
                }
            >
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column: Balance, Name & Type */}
                    <div className="space-y-4 flex flex-col justify-between">
                        {/* Big Balance Input Display */}
                        <div className="flex flex-col items-center justify-center p-6 bg-secondary/30 rounded-2xl border border-border/40 relative overflow-hidden flex-1 min-h-[130px]">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 select-none">
                                Initial Balance
                            </span>
                            <div className="flex items-center justify-center w-full">
                                <input
                                    type="text"
                                    placeholder="10,000"
                                    value={balanceInput}
                                    onChange={(e) => {
                                        const formatted = formatWithCommas(e.target.value);
                                        setBalanceInput(formatted);
                                    }}
                                    className="text-4xl font-extrabold tracking-tight text-center text-foreground bg-transparent border-none focus:outline-none w-full select-all placeholder:text-muted-foreground/30 focus:ring-0"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Account Name"
                                placeholder="e.g., Checking"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />

                            <Select
                                label="Account Type"
                                value={formData.type}
                                onChange={(e) => handleTypeChange(e.target.value as any)}
                                options={[
                                    { value: 'checking', label: 'Checking' },
                                    { value: 'savings', label: 'Savings' },
                                    { value: 'credit', label: 'Credit Card' },
                                ]}
                            />
                        </div>
                    </div>

                    {/* Right Column: Customization (Color & Icon) */}
                    <div className="space-y-4 border-t md:border-t-0 md:border-l border-border/45 pt-4 md:pt-0 md:pl-6">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Color</label>
                            <div className="flex gap-2 flex-wrap pt-1">
                                {ACCOUNT_COLORS.map((color) => (
                                    <button
                                        key={color}
                                        onClick={() => setFormData({ ...formData, color })}
                                        className={`w-7.5 h-7.5 rounded-full transition-all flex items-center justify-center cursor-pointer border border-black/10 dark:border-white/10 ${
                                            formData.color === color 
                                                ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110 shadow-sm' 
                                                : 'hover:scale-105 opacity-80 hover:opacity-100'
                                        }`}
                                        style={{ backgroundColor: color }}
                                        type="button"
                                        aria-label={`Select color ${color}`}
                                    >
                                        {formData.color === color && (
                                            <Check className="w-3.5 h-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Icon</label>
                            <div className="grid grid-cols-6 gap-2 pt-1">
                                {ACCOUNT_ICONS.map((icon) => (
                                    <button
                                        key={icon}
                                        onClick={() => setFormData({ ...formData, icon })}
                                        className={`w-9.5 h-9.5 rounded-xl text-lg flex items-center justify-center transition-all border cursor-pointer ${
                                            formData.icon === icon 
                                                ? 'bg-primary/10 border-primary text-primary font-bold scale-105 ring-2 ring-primary/20' 
                                                : 'bg-secondary/40 border-border/50 hover:bg-secondary/80 text-muted-foreground hover:text-foreground hover:scale-105'
                                        }`}
                                        type="button"
                                        aria-label={`Select icon ${icon}`}
                                    >
                                        {icon}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </form>
            </Modal>

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
                            Delete Account
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <div className="p-4 bg-destructive/10 text-destructive rounded-xl border border-destructive/20 flex gap-3 items-start">
                        <span className="text-2xl mt-0.5">⚠️</span>
                        <div>
                            <h4 className="font-bold text-lg">Are you absolutely sure?</h4>
                            <p className="text-sm mt-1 text-destructive/90 leading-relaxed">
                                This action will permanently delete the account{' '}
                                <strong className="underline">
                                    {state.accounts.find((acc) => acc.id === deletingAccountId)?.name}
                                </strong>{' '}
                                and all its transactions. This action cannot be undone.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                            To confirm, type <strong className="text-foreground select-all">{state.accounts.find((acc) => acc.id === deletingAccountId)?.name}</strong> below:
                        </p>
                        <Input
                            placeholder="Type account name to confirm"
                            value={confirmNameInput}
                            onChange={(e) => setConfirmNameInput(e.target.value)}
                        />
                    </div>
                </div>
            </Modal>

            <Modal
                open={!!reconciliationData}
                onOpenChange={(open) => !open && setReconciliationData(null)}
                title="Confirm Reconciliation"
                size="md"
                footer={
                    <div className="flex gap-2 justify-end w-full">
                        <Button variant="ghost" onClick={() => setReconciliationData(null)}>
                            Cancel
                        </Button>
                        <Button onClick={handleConfirmReconciliation}>
                            Confirm
                        </Button>
                    </div>
                }
            >
                {reconciliationData && (
                    <div className="space-y-4">
                        <div className="p-4 bg-secondary/30 rounded-xl border border-border/40 space-y-3">
                            <h4 className="font-semibold text-foreground">Balance Update Summary</h4>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Original Balance:</span>
                                <span className="font-medium text-foreground">${reconciliationData.originalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">New Balance:</span>
                                <span className="font-medium text-foreground">${reconciliationData.newBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-sm border-t border-border/40 pt-2 mt-2">
                                <span className="text-muted-foreground">Difference:</span>
                                <span className={`font-bold ${reconciliationData.diff > 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                                    {reconciliationData.diff > 0 ? '+' : '-'}${Math.abs(reconciliationData.diff).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            To ensure your total balance is accurate, a <strong className="text-foreground">reconciliation transaction</strong> will be automatically created for this difference.
                        </p>
                    </div>
                )}
            </Modal>
        </div>
    );
}
