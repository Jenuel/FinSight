'use client';

import { useState, useCallback, useEffect } from 'react';
import { FinanceProvider, useFinance } from '@/lib/context';
import { IS_API_MODE } from '@/lib/services/data-service';
import { DashboardPage } from '@/components/pages/dashboard-page';
import { AccountsPage } from '@/components/pages/accounts-page';
import { TransactionsPage } from '@/components/pages/transactions-page';
import { AnalyticsPage } from '@/components/pages/analytics-page';
import { AuthPage } from '@/components/pages/auth-page';
import { useUser, useClerk } from '@clerk/nextjs';
import { 
  LayoutDashboard, 
  CreditCard, 
  ArrowLeftRight, 
  PieChart, 
  Plus, 
  Sun, 
  Moon, 
  LogOut, 
  Menu, 
  X, 
  Sparkles,
  TrendingUp,
  Keyboard
} from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isLocalLoggedIn, setIsLocalLoggedIn] = useState<boolean | null>(null);
  const [isGuestMode, setIsGuestMode] = useState<boolean>(false);
  const [localUserEmail, setLocalUserEmail] = useState<string>('');
  const [isDark, setIsDark] = useState(true);

  const { isLoaded: isClerkLoaded, isSignedIn: isClerkSignedIn, user: clerkUser } = useUser();
  const { signOut: clerkSignOut } = useClerk();

  // Initialize theme state from DOM or localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDarkMode = document.documentElement.classList.contains('dark');
      setIsDark(isDarkMode);
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('finsight-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('finsight-theme', 'light');
    }
  };

  useEffect(() => {
    const isGuest = localStorage.getItem('finsight-guest-mode') === 'true';
    if (isGuest) {
      setIsGuestMode(true);
      setLocalUserEmail('demo@finsight.com');
    }

    const loggedIn = localStorage.getItem('finsight-logged-in');
    const email = localStorage.getItem('finsight-user-email');
    if (loggedIn === 'true' && email) {
      setIsLocalLoggedIn(true);
      setLocalUserEmail(email);
    } else {
      setIsLocalLoggedIn(false);
    }
  }, []);

  const isLoggedIn = isGuestMode || (IS_API_MODE ? Boolean(isClerkSignedIn) : Boolean(isLocalLoggedIn));
  const userEmail = isGuestMode
    ? 'demo@finsight.com'
    : IS_API_MODE
      ? (clerkUser?.primaryEmailAddress?.emailAddress || '')
      : localUserEmail;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLoggedIn) return;

      const activeEl = document.activeElement;
      if (
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.hasAttribute('contenteditable')
      ) {
        return;
      }

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setActiveTab('transactions');
        setIsTransactionModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLoggedIn]);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  const handleLoginSuccess = (email: string) => {
    if (email === 'demo@finsight.com') {
      localStorage.setItem('finsight-guest-mode', 'true');
      setIsGuestMode(true);
    }
    localStorage.setItem('finsight-logged-in', 'true');
    localStorage.setItem('finsight-user-email', email);
    setIsLocalLoggedIn(true);
    setLocalUserEmail(email);
    setActiveTab('dashboard');
  };

  const handleLogout = async () => {
    localStorage.removeItem('finsight-logged-in');
    localStorage.removeItem('finsight-user-email');
    localStorage.removeItem('finsight-guest-mode');
    setIsGuestMode(false);
    setIsLocalLoggedIn(false);
    setLocalUserEmail('');
    
    if (isClerkSignedIn) {
      await clerkSignOut();
    }
  };

  const handleOpenNewTransaction = () => {
    setActiveTab('transactions');
    setIsTransactionModalOpen(true);
  };

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage />;
      case 'accounts':
        return <AccountsPage />;
      case 'transactions':
        return (
          <TransactionsPage
            isModalOpen={isTransactionModalOpen}
            setIsModalOpen={setIsTransactionModalOpen}
          />
        );
      case 'analytics':
        return <AnalyticsPage />;
      default:
        return <DashboardPage />;
    }
  };

  const initializing = IS_API_MODE ? !isClerkLoaded : isLocalLoggedIn === null;
  if (initializing) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-foreground space-y-4">
        <div className="relative w-12 h-12 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping opacity-50" />
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <TrendingUp className="w-5 h-5 text-white animate-pulse" />
          </div>
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground animate-pulse">
          Loading FinSight...
        </p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <FinanceProvider>
      <div className="h-screen flex flex-col bg-background overflow-hidden animate-fade-in">
        <Header 
          activeTab={activeTab} 
          onTabChange={handleTabChange} 
          userEmail={userEmail} 
          onLogout={handleLogout}
          isDark={isDark}
          onToggleTheme={toggleTheme}
          onOpenNewTransaction={handleOpenNewTransaction}
        />
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <Sidebar 
            activeTab={activeTab} 
            onTabChange={handleTabChange}
            onOpenNewTransaction={handleOpenNewTransaction}
          />
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 h-full">
              <MainContent renderPage={renderPage} />
            </div>
          </main>
        </div>
      </div>
    </FinanceProvider>
  );
}

function Header({
  activeTab,
  onTabChange,
  userEmail,
  onLogout,
  isDark,
  onToggleTheme,
  onOpenNewTransaction,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userEmail: string;
  onLogout: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenNewTransaction: () => void;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 glass-panel">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        {/* Logo & Brand Identity */}
        <div className="flex items-center gap-3">
          <div 
            onClick={() => onTabChange('dashboard')}
            className="w-9 h-9 rounded-xl bg-card border border-border/80 flex items-center justify-center text-foreground hover:border-border cursor-pointer transition-colors shadow-xs"
          >
            <TrendingUp className="w-4.5 h-4.5 text-emerald-500" />
          </div>
          <div className="flex items-center gap-2">
            <span 
              onClick={() => onTabChange('dashboard')} 
              className="text-lg font-bold font-heading tracking-tight text-foreground cursor-pointer"
            >
              FinSight
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary/80 text-muted-foreground border border-border/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              LIVE
            </span>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2.5">
          {/* Dark / Light Mode Switcher */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/70 border border-transparent hover:border-border/50 transition-all duration-200 cursor-pointer"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* User pill & sign out */}
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-border/60">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-secondary/50 border border-border/40">
              <div className="w-6 h-6 rounded-full bg-secondary border border-border/60 flex items-center justify-center text-[11px] font-semibold text-foreground uppercase">
                {userEmail ? userEmail[0] : 'U'}
              </div>
              <span className="text-xs font-medium text-foreground/80 max-w-[130px] truncate select-none">
                {userEmail || 'Demo User'}
              </span>
            </div>

            <button
              onClick={onLogout}
              className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all duration-200 cursor-pointer"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-foreground hover:bg-secondary transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <MobileMenu
          activeTab={activeTab}
          onTabChange={(tab) => {
            onTabChange(tab);
            setIsMobileMenuOpen(false);
          }}
          userEmail={userEmail}
          onLogout={onLogout}
          onOpenNewTransaction={() => {
            onOpenNewTransaction();
            setIsMobileMenuOpen(false);
          }}
        />
      )}
    </header>
  );
}

function MobileMenu({
  activeTab,
  onTabChange,
  userEmail,
  onLogout,
  onOpenNewTransaction,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userEmail: string;
  onLogout: () => void;
  onOpenNewTransaction: () => void;
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'accounts', label: 'Accounts', icon: CreditCard },
    { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
    { id: 'analytics', label: 'Analytics', icon: PieChart },
  ];

  return (
    <div className="md:hidden border-t border-border/60 p-4 space-y-3 glass-panel animate-fade-in">
      <button
        onClick={onOpenNewTransaction}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-sm"
      >
        <Plus className="w-4 h-4" />
        Log Transaction
      </button>

      <div className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary/15 text-primary font-semibold border border-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="pt-3 border-t border-border/50 flex items-center justify-between px-2">
        <span className="text-xs text-muted-foreground truncate max-w-[200px]">{userEmail}</span>
        <button
          onClick={onLogout}
          className="text-xs font-semibold text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded-lg border border-destructive/20 transition-all flex items-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

function Sidebar({ 
  activeTab, 
  onTabChange,
  onOpenNewTransaction
}: { 
  activeTab: string; 
  onTabChange: (tab: string) => void;
  onOpenNewTransaction: () => void;
}) {
  const { state } = useFinance();
  const totalBalance = state.accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'accounts', label: 'Accounts', icon: CreditCard, count: state.accounts.length },
    { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight, count: state.transactions.length },
    { id: 'analytics', label: 'Analytics', icon: PieChart },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-border/60 glass-panel p-4 justify-between select-none">
      <div className="space-y-6">
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold font-heading uppercase tracking-wider text-muted-foreground/70 mb-2">
            Platform
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer group ${
                  isActive
                    ? 'bg-secondary/90 text-foreground font-semibold border border-border/80 shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg transition-colors ${
                    isActive ? 'bg-foreground text-background' : 'text-muted-foreground group-hover:text-foreground'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && (
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono transition-colors ${
                    isActive ? 'bg-card text-foreground font-semibold border border-border/60' : 'bg-secondary/80 text-muted-foreground'
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sidebar Footer: Fluid Liquidity Status */}
      <div className="pt-4 border-t border-border/40 px-2 space-y-3">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
            Total Liquidity
          </span>
          <p className="text-lg font-bold tracking-tight text-foreground font-mono tabular-nums mt-0.5">
            ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t border-border/30">
          <span className="flex items-center gap-1.5">
            <Keyboard className="w-3 h-3 text-muted-foreground/80" />
            <span>Quick log</span>
          </span>
          <kbd className="px-1.5 py-0.5 rounded bg-secondary/80 font-mono text-[10px] text-foreground border border-border/60">
            N
          </kbd>
        </div>
      </div>
    </aside>
  );
}

function MainContent({ renderPage }: { renderPage: () => React.ReactNode }) {
  const { isLoaded } = useFinance();

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] space-y-4 text-center animate-fade-in">
        <div className="relative w-14 h-14 flex items-center justify-center">
          <div className="absolute inset-0 rounded-2xl border border-primary/30 animate-ping opacity-30" />
          <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center animate-spin">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-foreground tracking-tight">Syncing Financial Data</h3>
          <p className="text-xs text-muted-foreground max-w-[280px] mx-auto">
            Connecting to your secure ledger...
          </p>
        </div>
      </div>
    );
  }

  return <>{renderPage()}</>;
}
