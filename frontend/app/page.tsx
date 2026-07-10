'use client';

import { useState, useCallback, useEffect } from 'react';
import { FinanceProvider, useFinance } from '@/lib/context';
import { DashboardPage } from '@/components/pages/dashboard-page';
import { AccountsPage } from '@/components/pages/accounts-page';
import { TransactionsPage } from '@/components/pages/transactions-page';
import { AnalyticsPage } from '@/components/pages/analytics-page';
import { AuthPage } from '@/components/pages/auth-page';
import { useUser, useClerk } from '@clerk/nextjs';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isLocalLoggedIn, setIsLocalLoggedIn] = useState<boolean | null>(null);
  const [localUserEmail, setLocalUserEmail] = useState<string>('');

  const { isLoaded: isClerkLoaded, isSignedIn: isClerkSignedIn, user: clerkUser } = useUser();
  const { signOut: clerkSignOut } = useClerk();

  useEffect(() => {
    const loggedIn = localStorage.getItem('finsight-logged-in');
    const email = localStorage.getItem('finsight-user-email');
    if (loggedIn === 'true' && email) {
      setIsLocalLoggedIn(true);
      setLocalUserEmail(email);
    } else {
      setIsLocalLoggedIn(false);
    }
  }, []);

  const isLoggedIn = isClerkSignedIn || isLocalLoggedIn;
  const userEmail = clerkUser?.primaryEmailAddress?.emailAddress || localUserEmail;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLoggedIn) return;

      // Ignore shortcut if user is actively typing in form fields
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
    // If we're logging in via Mock Auth, the auth page will call this.
    // We update local state just to be safe. If Clerk was used, it will automatically update isClerkSignedIn.
    if (!isClerkSignedIn) {
      localStorage.setItem('finsight-logged-in', 'true');
      localStorage.setItem('finsight-user-email', email);
      setIsLocalLoggedIn(true);
      setLocalUserEmail(email);
    }
    setActiveTab('dashboard');
  };

  const handleLogout = async () => {
    // Clear mock state
    localStorage.removeItem('finsight-logged-in');
    localStorage.removeItem('finsight-user-email');
    setIsLocalLoggedIn(false);
    setLocalUserEmail('');
    
    // Clear clerk state
    if (isClerkSignedIn) {
      await clerkSignOut();
    }
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

  if (isLocalLoggedIn === null || !isClerkLoaded) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <svg className="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <FinanceProvider>
      <div className="h-screen flex flex-col bg-background overflow-hidden animate-fade-in">
        <Header activeTab={activeTab} onTabChange={handleTabChange} userEmail={userEmail} onLogout={handleLogout} />
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
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
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userEmail: string;
  onLogout: () => void;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
      <div className="flex items-center justify-between py-4 pr-6 pl-4">
        {/* Logo — fixed w-64 to align with the sidebar */}
        <div className="flex items-center gap-2 w-64 shrink-0">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-foreground hidden sm:block">FinSight</h1>
        </div>

        {/* Right side controls / user info & logout */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3">
            <span className="text-xs text-muted-foreground select-none max-w-[150px] truncate">
              {userEmail}
            </span>
            <button
              onClick={onLogout}
              className="text-xs font-medium text-muted-foreground hover:text-destructive px-2 py-1 rounded hover:bg-destructive/5 transition-all flex items-center gap-1.5"
              title="Sign Out"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-foreground hover:text-primary transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <MobileMenu
          activeTab={activeTab}
          onTabChange={onTabChange}
          userEmail={userEmail}
          onLogout={onLogout}
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
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userEmail: string;
  onLogout: () => void;
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'accounts', label: 'Accounts' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'analytics', label: 'Analytics' },
  ];

  return (
    <div className="md:hidden border-t border-border p-4 space-y-4 bg-card">
      <div className="space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center px-4 py-2 rounded-lg transition-colors text-left ${activeTab === item.id ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'
              }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="pt-4 border-t border-border flex items-center justify-between px-4">
        <span className="text-xs text-muted-foreground truncate max-w-[180px]">{userEmail}</span>
        <button
          onClick={onLogout}
          className="text-xs font-semibold text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded-lg border border-destructive/20 transition-all flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </div>
    </div>
  );
}

function Sidebar({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'accounts', label: 'Accounts', icon: '💳' },
    { id: 'transactions', label: 'Transactions', icon: '📈' },
    { id: 'analytics', label: 'Analytics', icon: '📉' },
  ];

  return (
    <nav className="hidden md:flex flex-col w-64 border-r border-border bg-card p-4 gap-1 overflow-y-auto">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onTabChange(item.id)}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === item.id ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'
            }`}
        >
          <span>{item.icon}</span>
          {item.label}
        </button>
      ))}
    </nav>
  );
}

function MainContent({ renderPage }: { renderPage: () => React.ReactNode }) {
  const { isLoaded } = useFinance();

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] space-y-6 text-center animate-fade-in">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-muted/30"></div>
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-foreground tracking-tight">Warming up backend...</h3>
          <p className="text-sm text-muted-foreground max-w-[280px] mx-auto leading-relaxed">
            Please wait while the server wakes up. This might take up to 50 seconds on the free tier.
          </p>
        </div>
      </div>
    );
  }

  return <>{renderPage()}</>;
}
