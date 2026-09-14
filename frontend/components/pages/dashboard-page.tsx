'use client';

import { useMemo, useState } from 'react';
import { useFinance } from '@/lib/context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DEFAULT_CATEGORIES } from '@/lib/types';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Sparkles, 
  CreditCard, 
  Activity,
  Layers
} from 'lucide-react';
import { FinanceIcon } from '@/components/ui/finance-icon';

export function DashboardPage() {
  const { state } = useFinance();
  const [currentTimestamp] = useState(() => Date.now());
  const [periodMode, setPeriodMode] = useState<'month' | '30d'>('month');

  const stats = useMemo(() => {
    const now = new Date(currentTimestamp);
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const thirtyDaysAgo = new Date(currentTimestamp - 30 * 24 * 60 * 60 * 1000);

    const isCalendarMonth = periodMode === 'month';
    const periodStart = isCalendarMonth ? startOfCurrentMonth : thirtyDaysAgo;
    const periodEnd = isCalendarMonth ? endOfCurrentMonth : new Date(currentTimestamp);

    const monthIncome = state.transactions
      .filter((txn) => {
        const d = new Date(txn.date);
        return txn.type === 'income' && d >= periodStart && d <= periodEnd;
      })
      .reduce((sum, txn) => sum + txn.amount, 0);

    const monthExpense = state.transactions
      .filter((txn) => {
        const d = new Date(txn.date);
        return txn.type === 'expense' && d >= periodStart && d <= periodEnd;
      })
      .reduce((sum, txn) => sum + txn.amount, 0);

    const monthlyNet = monthIncome - monthExpense;
    const totalBalance = state.accounts.reduce((sum, acc) => sum + acc.balance, 0);

    const recentTransactions = [...state.transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);

    const savingsRate = monthIncome > 0 
      ? Math.max(0, Math.round(((monthIncome - monthExpense) / monthIncome) * 100))
      : 0;

    const currentMonthLabel = now.toLocaleString('en-US', { month: 'long' });

    return {
      monthIncome,
      monthExpense,
      monthlyNet,
      totalBalance,
      recentTransactions,
      savingsRate,
      currentMonthLabel,
    };
  }, [state, currentTimestamp, periodMode]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner & Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight text-foreground">
              Financial Overview
            </h1>
            <Badge variant="outline" className="text-[10px] font-mono tracking-wider uppercase border-border/70 text-muted-foreground bg-secondary/80">
              Live Ledger
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Welcome to FinSight. Here is your real-time liquidity and monthly cashflow posture.
          </p>
        </div>

        {/* Period Selector: This Month vs Trailing 30 Days */}
        <div className="flex bg-secondary/50 p-1 rounded-xl border border-border/50 shrink-0 self-start sm:self-auto select-none">
          <button
            onClick={() => setPeriodMode('month')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              periodMode === 'month'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            This Month ({stats.currentMonthLabel})
          </button>
          <button
            onClick={() => setPeriodMode('30d')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              periodMode === '30d'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Trailing 30 Days
          </button>
        </div>
      </div>

      {/* Fluid Executive Metrics Ribbon (De-boxed) */}
      <div className="rounded-2xl glass-card border border-border/70 p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 divide-y lg:divide-y-0 lg:divide-x divide-border/40">
          {/* Total Liquidity */}
          <div className="space-y-1 pr-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
              Total Liquidity
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight text-foreground font-mono tabular-nums">
              ${stats.totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{state.accounts.length}</span> active ledgers
            </p>
          </div>

          {/* Monthly Inflow */}
          <div className="space-y-1 pt-4 lg:pt-0 lg:px-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
              Monthly Inflow
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight income-text font-mono tabular-nums">
              +${stats.monthIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground">
              {periodMode === 'month' ? `${stats.currentMonthLabel} income` : 'Trailing 30-day income'}
            </p>
          </div>

          {/* Monthly Outflow */}
          <div className="space-y-1 pt-4 lg:pt-0 lg:px-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
              Monthly Outflow
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight expense-text font-mono tabular-nums">
              -${stats.monthExpense.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground">
              {periodMode === 'month' ? `${stats.currentMonthLabel} expenses` : 'Trailing 30-day expenses'}
            </p>
          </div>

          {/* Monthly Net Cash Flow */}
          <div className="space-y-1 pt-4 lg:pt-0 lg:pl-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
              Monthly Net Flow
            </span>
            <p className={`text-2xl sm:text-3xl font-extrabold font-heading tracking-tight font-mono tabular-nums ${
              stats.monthlyNet >= 0 ? 'income-text' : 'expense-text'
            }`}>
              {stats.monthlyNet >= 0 ? '+' : '-'}${Math.abs(stats.monthlyNet).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{stats.savingsRate}%</span> savings rate
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Accounts Deck & Recent Transactions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column (1/3): Quick Accounts Snapshot */}
        <div className="space-y-6">
          <Card className="border-border/70">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-heading flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  Your Accounts
                </CardTitle>
                <span className="text-xs text-muted-foreground font-mono">
                  {state.accounts.length} Total
                </span>
              </div>
              <CardDescription>
                Live balance distribution across ledgers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 pt-2">
              {state.accounts.length > 0 ? (
                state.accounts.slice(0, 4).map((account) => (
                  <div
                    key={account.id}
                    className="px-3 py-2.5 rounded-xl hover:bg-secondary/50 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center border border-border/40 shrink-0"
                        style={{ backgroundColor: `${account.color}15`, color: account.color }}
                      >
                        <FinanceIcon id={account.icon || account.type} size={15} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate max-w-[120px]">
                          {account.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase font-medium">
                          {account.type}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-sm text-foreground tabular-nums">
                      ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No accounts linked yet.
                </div>
              )}

              {state.accounts.length > 4 && (
                <p className="text-xs text-center text-muted-foreground font-medium pt-2">
                  +{state.accounts.length - 4} more accounts in Accounts tab
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Velocity Card */}
          <Card className="border-border/70 bg-gradient-to-br from-secondary/40 via-card to-card">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                  Monthly Spend Velocity
                </span>
                <span className="font-mono font-bold tabular-nums text-foreground">
                  ${stats.monthExpense.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${Math.min(100, stats.monthIncome > 0 ? (stats.monthExpense / stats.monthIncome) * 100 : 50)}%` 
                  }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {stats.savingsRate >= 20 
                  ? `Strong savings momentum (${stats.savingsRate}% retained). Outflows are well within monthly income.`
                  : 'Monthly spending velocity is active. Review category breakdown in Analytics.'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (2/3): Live Recent Transactions */}
        <div className="lg:col-span-2">
          <Card className="border-border/70 h-full flex flex-col justify-between">
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-heading flex items-center gap-2">
                    <Activity className="w-4 h-4 text-muted-foreground" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>
                    Latest transactions across all accounts
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="font-mono text-xs">
                  Last 30 Days
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              {stats.recentTransactions.length > 0 ? (
                <div className="divide-y divide-border/30">
                  {stats.recentTransactions.map((txn) => {
                    const category = DEFAULT_CATEGORIES.find((cat) => cat.id === txn.category);
                    const account = state.accounts.find((acc) => acc.id === txn.accountId);

                    return (
                      <div 
                        key={txn.id} 
                        className="flex items-center justify-between px-6 py-4 hover:bg-secondary/30 transition-colors group"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-secondary/50 border border-border/40 flex items-center justify-center text-foreground/80 shrink-0 group-hover:scale-105 transition-transform">
                            <FinanceIcon id={txn.category} size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-foreground truncate">
                              {txn.description}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              <span className="font-medium text-foreground/80">{category?.name || txn.category}</span>
                              <span>•</span>
                              <span>{account?.name || 'Account'}</span>
                              <span>•</span>
                              <span>{new Date(txn.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0 pl-3">
                          <span className={`font-mono font-bold text-sm sm:text-base tabular-nums ${
                            txn.type === 'income' ? 'income-text' : 'expense-text'
                          }`}>
                            {txn.type === 'income' ? '+' : '-'}${txn.amount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-secondary/60 flex items-center justify-center mx-auto text-muted-foreground">
                    <Layers className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium text-foreground">No recent transactions</p>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    Press &apos;N&apos; on your keyboard or use the button above to log your first transaction.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
