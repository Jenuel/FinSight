'use client';

import { useState } from 'react';
import { Plus, Edit2, Trash2, Check } from 'lucide-react';
import { useFinance } from '@/lib/context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button-custom';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { ACCOUNT_COLORS } from '@/lib/types';

const ACCOUNT_ICONS = ['🏦', '💳', '🐷', '💰', '💵', '📈', '💼', '🛡️', '🚀', '🏠', '🪙', '🔑'];

const getMaskedNumber = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const digits = Math.abs(hash % 10000).toString().padStart(4, '8');
    return `•••• ${digits}`;
};

export function AccountsPage() {
    const { state, addAccount, updateAccount, deleteAccount } = useFinance();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
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

        if (editingId) {
            updateAccount(editingId, formData);
            setEditingId(null);
        } else {
            addAccount({
                id: `acc-${Date.now()}`,
                ...formData,
                currency: 'USD',
                createdAt: new Date().toISOString(),
            });
        }

        setFormData({ name: '', type: 'checking', color: ACCOUNT_COLORS[0], icon: '🏦', balance: 0 });
        setIsModalOpen(false);
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
            setEditingId(id);
            setIsModalOpen(true);
        }
    };

    const handleClose = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setFormData({ name: '', type: 'checking', color: ACCOUNT_COLORS[0], icon: '🏦', balance: 0 });
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

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {state.accounts.map((account) => {
                    const lastFour = getMaskedNumber(account.id);
                    
                    return (
                        <div
                            key={account.id}
                            style={{
                                backgroundColor: account.color,
                                backgroundImage: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(0, 0, 0, 0.35) 100%)',
                                boxShadow: `0 10px 25px -5px ${account.color}33`,
                                '--glow-color': `${account.color}50`,
                            } as React.CSSProperties}
                            className="group relative overflow-hidden rounded-2xl p-5 text-white transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-[0_15px_30px_var(--glow-color)] aspect-[1.75/1] max-w-sm w-full select-none border border-white/10"
                        >
                            {/* Card Gloss reflection overlay */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10 pointer-events-none" />

                            {/* Top row */}
                            <div className="flex items-start justify-between">
                                <div className="space-y-0.5 min-w-0 pr-2">
                                    <h3 className="text-base font-bold text-white tracking-wide truncate" title={account.name}>
                                        {account.name}
                                    </h3>
                                    <p className="text-[10px] text-white/65 tracking-wider capitalize font-medium">{account.type} Account</p>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    {/* Action buttons sliding out on hover */}
                                    <div className="flex gap-1.5 opacity-100 md:opacity-0 md:translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 z-20">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEdit(account.id);
                                            }}
                                            className="p-1.5 rounded-full bg-white/15 hover:bg-white/30 border border-white/20 text-white backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center"
                                            title="Edit Account"
                                        >
                                            <Edit2 className="w-3 h-3" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (window.confirm('Are you sure you want to delete this account and all its transactions?')) {
                                                    deleteAccount(account.id);
                                                }
                                            }}
                                            className="p-1.5 rounded-full bg-rose-500/25 hover:bg-rose-500/40 border border-rose-500/30 text-rose-100 hover:text-white backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center"
                                            title="Delete Account"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>

                                    {/* Account icon */}
                                    <div className="w-8 h-8 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-base shadow-inner z-10">
                                        {account.icon || '🏦'}
                                    </div>
                                </div>
                            </div>

                            {/* Middle Row (Balance) */}
                            <div className="my-1.5">
                                <span className="text-[9px] tracking-wider text-white/50 uppercase font-medium">Available Balance</span>
                                <div className="text-xl font-bold tracking-tight text-white">
                                    ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                            </div>

                            {/* Bottom Row (Chip, contactless and card number) */}
                            <div className="flex items-center justify-between pt-1.5 border-t border-white/10">
                                <div className="flex items-center gap-2.5">
                                    {/* Minimalist smart card chip */}
                                    <div className="w-7 h-5 rounded-xs bg-white/15 border border-white/25 relative overflow-hidden flex items-center justify-center opacity-85">
                                        <div className="absolute inset-x-0 top-1/2 h-[1px] bg-white/25" />
                                        <div className="absolute inset-y-0 left-1/3 w-[1px] bg-white/25" />
                                        <div className="absolute inset-y-0 right-1/3 w-[1px] bg-white/25" />
                                    </div>
                                    
                                    {/* Contactless indicator */}
                                    <svg className="w-3.5 h-3.5 text-white/40 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M5 12a10 10 0 0 1 5.5-9" />
                                        <path d="M5 12a6 6 0 0 1 3.3-5.4" />
                                        <path d="M5 12a2 2 0 0 1 1.1-1.8" />
                                    </svg>
                                </div>

                                <div className="text-[10px] font-mono tracking-widest text-white/60 select-all">
                                    {lastFour}
                                </div>
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
                size="md"
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
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Account Name"
                        placeholder="e.g., Checking Account"
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

                    <Input
                        label="Initial Balance"
                        type="number"
                        placeholder="0.00"
                        step="0.01"
                        value={formData.balance}
                        onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
                    />

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Color</label>
                        <div className="flex gap-2 flex-wrap">
                            {ACCOUNT_COLORS.map((color) => (
                                <button
                                    key={color}
                                    onClick={() => setFormData({ ...formData, color })}
                                    className={`w-8 h-8 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
                                        formData.color === color ? 'ring-2 ring-primary scale-110' : 'hover:scale-105'
                                    }`}
                                    style={{ backgroundColor: color }}
                                    type="button"
                                    aria-label={`Select color ${color}`}
                                >
                                    {formData.color === color && (
                                        <Check className="w-4 h-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Icon</label>
                        <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
                            {ACCOUNT_ICONS.map((icon) => (
                                <button
                                    key={icon}
                                    onClick={() => setFormData({ ...formData, icon })}
                                    className={`w-10 h-10 rounded-lg text-lg flex items-center justify-center bg-muted hover:bg-muted/80 transition-all border cursor-pointer border-transparent ${
                                        formData.icon === icon ? 'ring-2 ring-primary bg-accent border-border scale-105' : 'hover:scale-105'
                                    }`}
                                    type="button"
                                    aria-label={`Select icon ${icon}`}
                                >
                                    {icon}
                                </button>
                            ))}
                        </div>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
