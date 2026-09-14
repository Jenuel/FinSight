'use client';

import { useState, useMemo, useEffect } from 'react';
import { useFinance } from '@/lib/context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DEFAULT_CATEGORIES, Transaction, Category } from '@/lib/types';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Percent,
  Wallet,
  Activity,
  Layers,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { FinanceIcon } from '@/components/ui/finance-icon';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const CATEGORY_COLORS: Record<string, string> = {
  food: '#f97316',        // warm orange
  transport: '#3b82f6',   // slate blue
  utilities: '#f59e0b',   // amber
  entertainment: '#a855f7', // purple
  healthcare: '#10b981',  // natural emerald
  shopping: '#ec4899',    // rose pink
  subscription: '#ef4444', // crimson
  travel: '#0ea5e9',      // ocean sky
  'other-expense': '#94a3b8', // slate gray
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card px-3.5 py-2.5 rounded-xl border border-border/80 shadow-2xl text-xs space-y-1 z-50">
        {label && <p className="font-semibold text-foreground text-xs">{label}</p>}
        {payload.map((pld: any) => (
          <div key={pld.name} className="flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: pld.color || pld.fill }} />
              <span className="text-muted-foreground">{pld.name}:</span>
            </div>
            <span className="font-mono font-bold text-foreground tabular-nums">
              {formatCurrency(pld.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function AnalyticsPage() {
  const { state } = useFinance();
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [categoryMonth, setCategoryMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [trendMode, setTrendMode] = useState<'daily' | 'monthly' | 'yearly'>('monthly');
  const [balanceTrendMode, setBalanceTrendMode] = useState<'daily' | 'monthly' | 'yearly'>('monthly');
  const [isMounted, setIsMounted] = useState(false);

  // Generate monthly options for the last 12 calendar months
  const monthOptions = useMemo(() => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      options.push({ value, label });
    }
    return options;
  }, []);

  // SSR Hydration Guard
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const currentIndex = monthOptions.findIndex((o) => o.value === selectedMonth);

  const handlePrevMonth = () => {
    if (currentIndex < monthOptions.length - 1) {
      setSelectedMonth(monthOptions[currentIndex + 1].value);
    }
  };

  const handleNextMonth = () => {
    if (currentIndex > 0) {
      setSelectedMonth(monthOptions[currentIndex - 1].value);
    }
  };

  const categoryIndex = monthOptions.findIndex((o) => o.value === categoryMonth);

  const handlePrevCategoryMonth = () => {
    if (categoryIndex < monthOptions.length - 1) {
      setCategoryMonth(monthOptions[categoryIndex + 1].value);
    }
  };

  const handleNextCategoryMonth = () => {
    if (categoryIndex > 0) {
      setCategoryMonth(monthOptions[categoryIndex - 1].value);
    }
  };

  // Filter transactions into current and previous calendar months
  const { currentTxns, prevTxns, currentMonthDays } = useMemo(() => {
    const txns = state.transactions;
    if (!selectedMonth) return { currentTxns: [], prevTxns: [], currentMonthDays: 30 };

    const [year, month] = selectedMonth.split('-').map(Number);
    
    const currentStart = new Date(year, month - 1, 1);
    const currentEnd = new Date(year, month, 0, 23, 59, 59, 999);
    const daysInMonth = currentEnd.getDate();

    const prevStart = new Date(year, month - 2, 1);
    const prevEnd = new Date(year, month - 1, 0, 23, 59, 59, 999);

    const current = txns.filter((t) => {
      const d = new Date(t.date);
      return d >= currentStart && d <= currentEnd;
    });

    const previous = txns.filter((t) => {
      const d = new Date(t.date);
      return d >= prevStart && d < currentStart;
    });

    return { currentTxns: current, prevTxns: previous, currentMonthDays: daysInMonth };
  }, [state.transactions, selectedMonth]);

  // General KPIs (Current Period)
  const metrics = useMemo(() => {
    const curExpenses = currentTxns.filter((t) => t.type === 'expense');
    const curIncome = currentTxns.filter((t) => t.type === 'income');
    const prevExpenses = prevTxns.filter((t) => t.type === 'expense');
    const prevIncome = prevTxns.filter((t) => t.type === 'income');

    const totalSpent = curExpenses.reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = curIncome.reduce((sum, t) => sum + t.amount, 0);
    const prevTotalSpent = prevExpenses.reduce((sum, t) => sum + t.amount, 0);
    const prevTotalIncome = prevIncome.reduce((sum, t) => sum + t.amount, 0);

    const netCashFlow = totalIncome - totalSpent;
    const savingsRate = totalIncome > 0 ? (netCashFlow / totalIncome) * 100 : 0;

    // Calculate percentage changes
    const spentChange = prevTotalSpent > 0 ? ((totalSpent - prevTotalSpent) / prevTotalSpent) * 100 : 0;
    const incomeChange = prevTotalIncome > 0 ? ((totalIncome - prevTotalIncome) / prevTotalIncome) * 100 : 0;

    return {
      totalSpent,
      totalIncome,
      netCashFlow,
      savingsRate,
      spentChange,
      incomeChange,
      hasPrevPeriod: prevTxns.length > 0,
    };
  }, [currentTxns, prevTxns]);

  // Filter transactions specifically for the category donut chart
  const categoryTxns = useMemo(() => {
    const txns = state.transactions;
    if (!categoryMonth) return [];

    const [year, month] = categoryMonth.split('-').map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    return txns.filter((t) => {
      const d = new Date(t.date);
      return d >= start && d <= end;
    });
  }, [state.transactions, categoryMonth]);

  const categoryTotalSpent = useMemo(() => {
    return categoryTxns
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [categoryTxns]);

  // Chart 1: Category Breakdown (Donut)
  const categoryData = useMemo(() => {
    const expenses = categoryTxns.filter((t) => t.type === 'expense');
    const breakdown: Record<string, number> = {};

    expenses.forEach((t) => {
      breakdown[t.category] = (breakdown[t.category] || 0) + t.amount;
    });

    return Object.entries(breakdown)
      .map(([catId, amount]) => {
        const catInfo = DEFAULT_CATEGORIES.find((c) => c.id === catId);
        const name = catInfo?.name || catId;
        const icon = catInfo?.icon || '📌';
        const color = CATEGORY_COLORS[catId] || '#6b7280';
        return {
          id: catId,
          name,
          icon,
          value: Number(amount.toFixed(2)),
          color,
          percentage: categoryTotalSpent > 0 ? Math.round((amount / categoryTotalSpent) * 100) : 0,
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [categoryTxns, categoryTotalSpent]);

  // Chart 2: Spending Over Time (Independent of selectedMonth, supporting daily/monthly/yearly toggles)
  const spendingOverTime = useMemo(() => {
    const expenses = state.transactions.filter((t) => t.type === 'expense');
    const now = new Date();

    if (trendMode === 'daily') {
      const days = 30;
      const data: Record<string, number> = {};
      const dateList: string[] = [];

      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateString = d.toISOString().split('T')[0];
        data[dateString] = 0;
        dateList.push(dateString);
      }

      expenses.forEach((t) => {
        const dateString = new Date(t.date).toISOString().split('T')[0];
        if (data[dateString] !== undefined) {
          data[dateString] += t.amount;
        }
      });

      return dateList.map((date) => {
        const d = new Date(date);
        return {
          label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          Amount: Number(data[date].toFixed(2)),
        };
      });
    } else if (trendMode === 'monthly') {
      const months = 12;
      const data: Record<string, number> = {};
      const monthLabels: string[] = [];

      for (let i = months - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        data[label] = 0;
        monthLabels.push(label);
      }

      expenses.forEach((t) => {
        const d = new Date(t.date);
        const label = new Date(d.getFullYear(), d.getMonth(), 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (data[label] !== undefined) {
          data[label] += t.amount;
        }
      });

      return monthLabels.map((label) => ({
        label,
        Amount: Number(data[label].toFixed(2)),
      }));
    } else {
      const years = 5;
      const data: Record<number, number> = {};
      const yearLabels: number[] = [];

      for (let i = years - 1; i >= 0; i--) {
        const year = now.getFullYear() - i;
        data[year] = 0;
        yearLabels.push(year);
      }

      expenses.forEach((t) => {
        const d = new Date(t.date);
        const year = d.getFullYear();
        if (data[year] !== undefined) {
          data[year] += t.amount;
        }
      });

      return yearLabels.map((year) => ({
        label: String(year),
        Amount: Number(data[year].toFixed(2)),
      }));
    }
  }, [state.transactions, trendMode]);

  // Chart 3: Income vs Expenses (Grouped Bar Chart)
  const incomeVsExpenses = useMemo(() => {
    const now = new Date();
    const months = 6;
    const data: Record<string, { income: number; expense: number }> = {};
    const monthLabels: string[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString('en-US', { month: 'short' });
      data[label] = { income: 0, expense: 0 };
      monthLabels.push(label);
    }

    state.transactions.forEach((t) => {
      const d = new Date(t.date);
      const label = d.toLocaleDateString('en-US', { month: 'short' });
      if (data[label] !== undefined) {
        if (t.type === 'income') {
          data[label].income += t.amount;
        } else {
          data[label].expense += t.amount;
        }
      }
    });

    return monthLabels.map((label) => ({
      month: label,
      Income: Number(data[label].income.toFixed(2)),
      Expenses: Number(data[label].expense.toFixed(2)),
    }));
  }, [state.transactions]);

  // Chart 4: Aggregated Balance Over Time
  const balanceOverTime = useMemo(() => {
    const currentTotalBalance = state.accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const now = new Date();

    if (balanceTrendMode === 'daily') {
      const days = 30;
      const dateList: Date[] = [];

      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        dateList.push(d);
      }

      return dateList.map((d) => {
        const boundary = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
        const txnsAfter = state.transactions.filter(
          (t) => new Date(t.date) > boundary
        );
        const adjustment = txnsAfter.reduce(
          (sum, t) => sum + (t.type === 'income' ? -t.amount : t.amount),
          0
        );
        return {
          label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          Balance: Number((currentTotalBalance + adjustment).toFixed(2)),
        };
      });
    } else if (balanceTrendMode === 'monthly') {
      const months = 12;
      const monthList: Date[] = [];

      for (let i = months - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthList.push(d);
      }

      return monthList.map((d) => {
        const boundary = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
        const txnsAfter = state.transactions.filter(
          (t) => new Date(t.date) > boundary
        );
        const adjustment = txnsAfter.reduce(
          (sum, t) => sum + (t.type === 'income' ? -t.amount : t.amount),
          0
        );
        return {
          label: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          Balance: Number((currentTotalBalance + adjustment).toFixed(2)),
        };
      });
    } else {
      const years = 5;
      const yearList: Date[] = [];

      for (let i = years - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear() - i, 0, 1);
        yearList.push(d);
      }

      return yearList.map((d) => {
        const boundary = new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999);
        const txnsAfter = state.transactions.filter(
          (t) => new Date(t.date) > boundary
        );
        const adjustment = txnsAfter.reduce(
          (sum, t) => sum + (t.type === 'income' ? -t.amount : t.amount),
          0
        );
        return {
          label: String(d.getFullYear()),
          Balance: Number((currentTotalBalance + adjustment).toFixed(2)),
        };
      });
    }
  }, [state.accounts, state.transactions, balanceTrendMode]);

  const balanceChangeMetrics = useMemo(() => {
    if (balanceOverTime.length < 2) return { amount: 0, percentage: 0, isPositive: true };
    const first = balanceOverTime[0].Balance;
    const last = balanceOverTime[balanceOverTime.length - 1].Balance;
    const amount = last - first;
    const percentage = first > 0 ? (amount / first) * 100 : 0;
    return {
      amount,
      percentage,
      isPositive: amount >= 0,
    };
  }, [balanceOverTime]);

  const balanceTrendColor = balanceChangeMetrics.isPositive ? 'var(--income)' : 'var(--expense)';

  // Top transactions list (Current Period)
  const topTransactions = useMemo(() => {
    return currentTxns
      .filter((t) => t.type === 'expense')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [currentTxns]);



  const renderKPIChange = (value: number, isGoodDecrease = false) => {
    if (!metrics.hasPrevPeriod) return null;
    
    const isIncrease = value > 0;
    const isZero = value === 0;
    
    let isPositiveIndicator = isIncrease;
    if (isGoodDecrease) {
      isPositiveIndicator = !isIncrease; // Spending decreasing is good
    }

    if (isZero) return <span className="text-xs text-muted-foreground mt-1">Flat vs last period</span>;

    return (
      <div className="flex items-center gap-1 mt-1">
        {isPositiveIndicator ? (
          <span className="text-xs font-semibold income-text flex items-center">
            <TrendingUp className="w-3 h-3 mr-0.5" />
            {Math.abs(value).toFixed(1)}%
          </span>
        ) : (
          <span className="text-xs font-semibold expense-text flex items-center">
            <TrendingDown className="w-3 h-3 mr-0.5" />
            {Math.abs(value).toFixed(1)}%
          </span>
        )}
        <span className="text-[10px] text-muted-foreground">vs last period</span>
      </div>
    );
  };

  if (!isMounted) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-56 bg-secondary/60 animate-pulse rounded-lg" />
            <div className="h-4 w-72 bg-secondary/40 animate-pulse rounded-md" />
          </div>
          <div className="h-10 w-44 bg-secondary/60 animate-pulse rounded-2xl" />
        </div>
        <div className="rounded-2xl glass-card border border-border/70 p-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 divide-y lg:divide-y-0 lg:divide-x divide-border/40">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2 p-2">
                <div className="h-3 w-20 bg-secondary/60 animate-pulse rounded" />
                <div className="h-7 w-28 bg-secondary/80 animate-pulse rounded" />
                <div className="h-3 w-16 bg-secondary/40 animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-80 rounded-2xl bg-card/60 border border-border/50 animate-pulse" />
          <div className="h-80 rounded-2xl bg-card/60 border border-border/50 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header & Date Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight text-foreground">
            Financial Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Deep analytical telemetry on spending velocity, category distributions, and wealth trajectories.
          </p>
        </div>
        <div className="flex items-center gap-1 bg-secondary/50 p-1.5 rounded-2xl border border-border/60 self-start sm:self-center select-none shrink-0 shadow-xs">
          <button
            onClick={handlePrevMonth}
            disabled={currentIndex === monthOptions.length - 1}
            className="p-1.5 rounded-xl hover:bg-card text-foreground disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer flex items-center justify-center"
            aria-label="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold px-3 min-w-[130px] text-center text-foreground uppercase tracking-wider">
            {monthOptions[currentIndex]?.label}
          </span>
          <button
            onClick={handleNextMonth}
            disabled={currentIndex === 0}
            className="p-1.5 rounded-xl hover:bg-card text-foreground disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer flex items-center justify-center"
            aria-label="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Fluid Executive Metrics Ribbon (De-boxed) */}
      <div className="rounded-2xl glass-card border border-border/70 p-5">
        <div key={selectedMonth} className="grid grid-cols-2 lg:grid-cols-4 gap-6 divide-y lg:divide-y-0 lg:divide-x divide-border/40 animate-fade-in">
          {/* Total Expense KPI */}
          <div className="space-y-1 pr-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Period Outflows</span>
            <p className="text-xl sm:text-2xl font-bold font-heading font-mono expense-text tabular-nums">
              {formatCurrency(metrics.totalSpent)}
            </p>
            {renderKPIChange(metrics.spentChange, true)}
          </div>

          {/* Total Income KPI */}
          <div className="space-y-1 pt-4 lg:pt-0 lg:px-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Period Inflows</span>
            <p className="text-xl sm:text-2xl font-bold font-heading font-mono income-text tabular-nums">
              {formatCurrency(metrics.totalIncome)}
            </p>
            {renderKPIChange(metrics.incomeChange, false)}
          </div>

          {/* Net Savings KPI */}
          <div className="space-y-1 pt-4 lg:pt-0 lg:px-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Net Cash Flow</span>
            <p className={`text-xl sm:text-2xl font-bold font-heading font-mono tabular-nums ${metrics.netCashFlow >= 0 ? 'income-text' : 'expense-text'}`}>
              {metrics.netCashFlow >= 0 ? '+' : ''}{formatCurrency(metrics.netCashFlow)}
            </p>
            <span className="text-xs text-muted-foreground block">Inflow minus outflow</span>
          </div>

          {/* Savings Rate KPI */}
          <div className="space-y-1 pt-4 lg:pt-0 lg:pl-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Savings Rate</span>
            <p className="text-xl sm:text-2xl font-bold font-heading font-mono text-foreground tabular-nums">
              {metrics.savingsRate.toFixed(1)}%
            </p>
            <span className="text-xs text-muted-foreground block">Percentage retained</span>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Spending by Category Donut */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Spending by Category</CardTitle>
              <CardDescription>Visual breakdown of expenses</CardDescription>
            </div>
            <div className="flex items-center gap-1 bg-secondary/50 p-1.5 rounded-2xl border border-border/60 self-start sm:self-center select-none shrink-0 shadow-xs">
              <button
                onClick={handlePrevCategoryMonth}
                disabled={categoryIndex === monthOptions.length - 1}
                className="p-1.5 rounded-xl hover:bg-card text-foreground disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer flex items-center justify-center"
                aria-label="Previous Category Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold px-2.5 min-w-[120px] text-center text-foreground uppercase tracking-wider">
                {monthOptions[categoryIndex]?.label}
              </span>
              <button
                onClick={handleNextCategoryMonth}
                disabled={categoryIndex === 0}
                className="p-1.5 rounded-xl hover:bg-card text-foreground disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer flex items-center justify-center"
                aria-label="Next Category Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center min-h-[300px]">
            {categoryData.length > 0 ? (
              <div className="flex flex-col lg:flex-row items-center justify-center gap-6">
                {/* Donut chart with overlay absolute text in center */}
                <div className="relative w-48 h-48 sm:w-56 sm:h-56 shrink-0 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart key={categoryMonth}>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                        isAnimationActive={true}
                        animationDuration={600}
                        animationEasing="ease-out"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute flex flex-col items-center justify-center pointer-events-none text-center">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Expenses</span>
                    <span className="text-lg sm:text-xl font-bold text-foreground mt-0.5">
                      {formatCurrency(categoryTotalSpent)}
                    </span>
                  </div>
                </div>

                {/* Donut Legend */}
                <div className="flex-1 w-full space-y-2 max-h-56 overflow-y-auto pr-1">
                  {categoryData.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between text-xs hover:bg-muted/40 p-1.5 rounded transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-5 h-5 rounded bg-secondary/80 flex items-center justify-center shrink-0">
                          <FinanceIcon id={cat.id} size={12} className="text-foreground/80" />
                        </div>
                        <span className="font-medium text-foreground truncate">{cat.name}</span>
                      </div>
                      <span className="font-semibold text-muted-foreground shrink-0 pl-2">
                        {formatCurrency(cat.value)} ({cat.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                No spending data available for this range
              </div>
            )}
          </CardContent>
        </Card>

        {/* Income vs Expenses Grouped Bar Chart */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Income vs. Expenses</CardTitle>
            <CardDescription>Monthly comparison over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={incomeVsExpenses} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.15 }} />
                <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Bar 
                  dataKey="Income" 
                  fill="var(--income)" 
                  radius={[4, 4, 0, 0]} 
                  name="Income"
                  isAnimationActive={true}
                  animationDuration={600}
                  animationEasing="ease-out"
                />
                <Bar 
                  dataKey="Expenses" 
                  fill="var(--expense)" 
                  radius={[4, 4, 0, 0]} 
                  name="Expenses"
                  isAnimationActive={true}
                  animationDuration={600}
                  animationEasing="ease-out"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Full-width Spending Over Time Area Chart */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Spending Trend</CardTitle>
            <CardDescription>Visualizing your expenses flow over time</CardDescription>
          </div>
          {/* Daily/Monthly/Yearly switcher */}
          <div className="flex bg-secondary/50 p-1 rounded-xl border border-border/50 self-start sm:self-center">
            {(['daily', 'monthly', 'yearly'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setTrendMode(mode)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all capitalize cursor-pointer ${
                  trendMode === mode ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart key={trendMode} data={spendingOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="linear"
                  dataKey="Amount"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#spendColor)"
                  name="Spent"
                  isAnimationActive={true}
                  animationDuration={500}
                  animationEasing="ease-out"
                  dot={{ r: 4, fill: 'var(--background)', stroke: 'var(--primary)', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: 'var(--primary)', stroke: 'var(--background)', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Support Layout Grid: Top Spending Categories and Largest Transactions */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Spending Categories List */}
        <Card>
          <CardHeader>
            <CardTitle>Top Spending Categories</CardTitle>
            <CardDescription>Main sources of your expenses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoryData.length > 0 ? (
              categoryData.slice(0, 5).map((cat) => (
                <div key={cat.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-md bg-secondary/80 flex items-center justify-center shrink-0 border border-border/40">
                        <FinanceIcon id={cat.id} size={13} className="text-foreground/80" />
                      </div>
                      <span className="font-semibold text-foreground truncate">{cat.name}</span>
                    </div>
                    <span className="font-bold text-foreground shrink-0 pl-2">
                      {formatCurrency(cat.value)} <span className="text-muted-foreground font-medium">({cat.percentage}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${cat.percentage}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Largest Transactions List */}
        <Card>
          <CardHeader>
            <CardTitle>Largest Expenses</CardTitle>
            <CardDescription>Highest value items purchased in current period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topTransactions.length > 0 ? (
                topTransactions.map((txn) => {
                  const category = DEFAULT_CATEGORIES.find((cat) => cat.id === txn.category);
                  const account = state.accounts.find((acc) => acc.id === txn.accountId);

                  return (
                    <div
                      key={txn.id}
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 border border-transparent hover:border-border transition-colors text-xs sm:text-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-secondary/60 border border-border/40 flex items-center justify-center shrink-0 text-foreground/80">
                          <FinanceIcon id={txn.category} size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">{txn.description}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                            {account?.name} • {new Date(txn.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold expense-text shrink-0 pl-2">
                        -{formatCurrency(txn.amount)}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                  No transactions recorded
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Full-width Aggregated Balance History Area Chart */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Balance History</CardTitle>
            <CardDescription className="flex flex-wrap items-center gap-2 mt-1">
              <span>Track the progress of your aggregated balance</span>
              {balanceOverTime.length >= 2 && (
                <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full select-none ${
                  balanceChangeMetrics.isPositive 
                    ? 'income-bg income-text' 
                    : 'expense-bg expense-text'
                }`}>
                  {balanceChangeMetrics.isPositive ? '↑' : '↓'}
                  {formatCurrency(Math.abs(balanceChangeMetrics.amount))} ({balanceChangeMetrics.isPositive ? '+' : ''}{balanceChangeMetrics.percentage.toFixed(1)}%)
                </span>
              )}
            </CardDescription>
          </div>
          {/* Daily/Monthly/Yearly switcher */}
          <div className="flex bg-secondary/50 p-1 rounded-xl border border-border/50 self-start sm:self-center">
            {(['daily', 'monthly', 'yearly'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setBalanceTrendMode(mode)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all capitalize cursor-pointer ${
                  balanceTrendMode === mode ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart key={balanceTrendMode} data={balanceOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="balanceColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={balanceTrendColor} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={balanceTrendColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} domain={['auto', 'auto']} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="Balance"
                  stroke={balanceTrendColor}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#balanceColor)"
                  name="Balance"
                  isAnimationActive={true}
                  animationDuration={500}
                  animationEasing="ease-out"
                  dot={{ r: 4, fill: 'var(--background)', stroke: balanceTrendColor, strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: balanceTrendColor, stroke: 'var(--background)', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
