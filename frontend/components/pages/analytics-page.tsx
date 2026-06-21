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
  food: '#fb923c',        // orange
  transport: '#60a5fa',   // blue
  utilities: '#fbbf24',   // amber
  entertainment: '#c084fc', // purple
  healthcare: '#34d399',  // emerald
  shopping: '#f472b6',    // pink
  subscription: '#f87171', // red
  travel: '#22d3ee',      // cyan
  'other-expense': '#9ca3af', // gray
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
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

  // Top transactions list (Current Period)
  const topTransactions = useMemo(() => {
    return currentTxns
      .filter((t) => t.type === 'expense')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [currentTxns]);

  // Recharts custom elements
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/95 border border-border px-3 py-2 rounded-lg shadow-lg backdrop-blur text-sm">
          <p className="text-xs text-muted-foreground mb-1">{label}</p>
          {payload.map((pld: any) => (
            <p key={pld.name} className="font-semibold flex items-center gap-1.5" style={{ color: pld.color || pld.fill }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pld.color || pld.fill }} />
              {pld.name}: {formatCurrency(pld.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            <div className="h-4 w-64 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="h-28 bg-card animate-pulse" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="h-96 bg-card animate-pulse" />
          <Card className="h-96 bg-card animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Date Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-1">Advanced insights into your financial health</p>
        </div>
        <div className="flex items-center gap-1.5 bg-muted p-1 rounded-lg border border-border self-start sm:self-center select-none shrink-0">
          <button
            onClick={handlePrevMonth}
            disabled={currentIndex === monthOptions.length - 1}
            className="p-1.5 rounded-md hover:bg-background text-foreground hover:shadow-xs disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer flex items-center justify-center"
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
            className="p-1.5 rounded-md hover:bg-background text-foreground hover:shadow-xs disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer flex items-center justify-center"
            aria-label="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Expense KPI */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-base font-bold text-foreground">Total Spent</p>
              <div className="w-7 h-7 rounded-full expense-bg flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4 expense-text" />
              </div>
            </div>
            <p key={`spent-${selectedMonth}`} className="text-2xl font-bold expense-text animate-fade-in-up" style={{ animationDelay: '0ms' }}>{formatCurrency(metrics.totalSpent)}</p>
            {renderKPIChange(metrics.spentChange, true)}
          </CardContent>
        </Card>

        {/* Total Income KPI */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-base font-bold text-foreground">Total Income</p>
              <div className="w-7 h-7 rounded-full income-bg flex items-center justify-center">
                <ArrowDownLeft className="w-4 h-4 income-text" />
              </div>
            </div>
            <p key={`income-${selectedMonth}`} className="text-2xl font-bold income-text animate-fade-in-up" style={{ animationDelay: '100ms' }}>{formatCurrency(metrics.totalIncome)}</p>
            {renderKPIChange(metrics.incomeChange, false)}
          </CardContent>
        </Card>

        {/* Net Savings KPI */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-base font-bold text-foreground">Net Cash Flow</p>
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-primary" />
              </div>
            </div>
            <p key={`net-${selectedMonth}`} className={`text-2xl font-bold animate-fade-in-up ${metrics.netCashFlow >= 0 ? 'income-text' : 'expense-text'}`} style={{ animationDelay: '200ms' }}>
              {metrics.netCashFlow >= 0 ? '+' : ''}{formatCurrency(metrics.netCashFlow)}
            </p>
            <span className="text-xs text-muted-foreground mt-1">Income minus expenses</span>
          </CardContent>
        </Card>

        {/* Savings Rate KPI */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-base font-bold text-foreground">Savings Rate</p>
              <div className="w-7 h-7 rounded-full bg-indigo-500/10 flex items-center justify-center">
                <Percent className="w-4 h-4 text-indigo-500" />
              </div>
            </div>
            <p key={`savings-${selectedMonth}`} className="text-2xl font-bold text-foreground animate-fade-in-up" style={{ animationDelay: '300ms' }}>{metrics.savingsRate.toFixed(1)}%</p>
            <span className="text-xs text-muted-foreground mt-1">Percentage of income saved</span>
          </CardContent>
        </Card>
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
            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg border border-border self-start sm:self-center select-none shrink-0">
              <button
                onClick={handlePrevCategoryMonth}
                disabled={categoryIndex === monthOptions.length - 1}
                className="p-1.5 rounded-md hover:bg-background text-foreground hover:shadow-xs disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer flex items-center justify-center"
                aria-label="Previous Category Month"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-bold px-2 min-w-[110px] text-center text-foreground uppercase tracking-wider">
                {monthOptions[categoryIndex]?.label}
              </span>
              <button
                onClick={handleNextCategoryMonth}
                disabled={categoryIndex === 0}
                className="p-1.5 rounded-md hover:bg-background text-foreground hover:shadow-xs disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer flex items-center justify-center"
                aria-label="Next Category Month"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center min-h-[300px]">
            {categoryData.length > 0 ? (
              <div className="flex flex-col lg:flex-row items-center justify-center gap-6">
                {/* Donut chart with overlay absolute text in center */}
                <div className="relative w-48 h-48 sm:w-56 sm:h-56 shrink-0 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
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
                        <span className="text-sm shrink-0">{cat.icon}</span>
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
                <Bar dataKey="Income" fill="var(--income)" radius={[4, 4, 0, 0]} name="Income" />
                <Bar dataKey="Expenses" fill="var(--expense)" radius={[4, 4, 0, 0]} name="Expenses" />
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
          <div className="flex bg-muted p-1 rounded-lg self-start sm:self-center">
            {(['daily', 'monthly', 'yearly'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setTrendMode(mode)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all capitalize cursor-pointer ${
                  trendMode === mode ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
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
              <AreaChart data={spendingOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                      <span className="text-lg shrink-0">{cat.icon}</span>
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
                        <span className="text-xl shrink-0">{category?.icon || '📌'}</span>
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
    </div>
  );
}
