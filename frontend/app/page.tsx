'use client';

import { useState, useCallback, useEffect } from 'react';
import { FinanceProvider } from '@/lib/context';
import { DashboardPage } from '@/components/pages/dashboard-page';
import { AccountsPage } from '@/components/pages/accounts-page';
import { TransactionsPage } from '@/components/pages/transactions-page';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
  }, []);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

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
        return <></>;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <FinanceProvider>
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        <Header activeTab={activeTab} onTabChange={handleTabChange} />
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
              {renderPage()}
            </div>
          </main>
        </div>
      </div>
    </FinanceProvider>
  );
}

function Header({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
      <div className="flex items-center justify-between py-4 pr-4">
        {/* Logo — fixed w-64 to align with the sidebar */}
        <div className="flex items-center gap-2 w-64 shrink-0 px-4">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-foreground hidden sm:block">Pragmatic Finance</h1>
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

      {isMobileMenuOpen && <MobileMenu activeTab={activeTab} onTabChange={onTabChange} />}
    </header>
  );
}

function MobileMenu({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'accounts', label: 'Accounts' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'analytics', label: 'Analytics' },
  ];

  return (
    <div className="md:hidden border-t border-border p-4 space-y-2">
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
