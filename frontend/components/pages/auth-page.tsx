'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AuthPageProps {
  onLoginSuccess: (email: string) => void;
}

export function AuthPage({ onLoginSuccess }: AuthPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (isSignUp && !name) {
      setError('Please enter your name');
      return;
    }

    setIsLoading(true);

    // Simulate network latency
    setTimeout(() => {
      try {
        if (isSignUp) {
          // Sign Up
          const users = JSON.parse(localStorage.getItem('finsight-users') || '[]');
          if (users.some((u: any) => u.email === email)) {
            setError('An account with this email already exists.');
            setIsLoading(false);
            return;
          }

          const newUser = { name, email, password };
          users.push(newUser);
          localStorage.setItem('finsight-users', JSON.stringify(users));
          onLoginSuccess(email);
        } else {
          // Sign In
          // Check demo credentials
          if (email === 'demo@finsight.com' && password === 'password') {
            onLoginSuccess(email);
            return;
          }

          const users = JSON.parse(localStorage.getItem('finsight-users') || '[]');
          const user = users.find((u: any) => u.email === email && u.password === password);

          if (!user) {
            setError('Invalid email or password');
            setIsLoading(false);
            return;
          }

          onLoginSuccess(email);
        }
      } catch (err) {
        setError('Something went wrong. Please try again.');
        setIsLoading(false);
      }
    }, 1000);
  };

  const handleDemoLogin = () => {
    setIsLoading(true);
    setEmail('demo@finsight.com');
    setPassword('password');
    setTimeout(() => {
      onLoginSuccess('demo@finsight.com');
    }, 800);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-background px-4 overflow-hidden">
      {/* Decorative premium background elements */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-[var(--income)]/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-md bg-card/65 backdrop-blur-xl border border-border/60 rounded-2xl shadow-2xl p-8 z-10 animate-fade-in-up">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 mb-3">
            <svg className="w-7 h-7 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">FinSight</h2>
          <p className="text-sm text-muted-foreground mt-1">Pragmatic financial intelligence</p>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-border mb-6">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setError('');
            }}
            className={`flex-1 pb-3 text-sm font-medium transition-colors relative ${
              !isSignUp ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Sign In
            {!isSignUp && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full animate-fade-in" />
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setError('');
            }}
            className={`flex-1 pb-3 text-sm font-medium transition-colors relative ${
              isSignUp ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Register
            {isSignUp && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full animate-fade-in" />
            )}
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-lg animate-shake">
              {error}
            </div>
          )}

          {isSignUp && (
            <div className="space-y-1.5">
              <Input
                label="Full Name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Input
              label="Email Address"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
            />
          </div>

          <div className="space-y-1.5">
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
            />
          </div>

          <Button type="submit" className="w-full h-10 mt-2 font-medium" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </span>
            ) : isSignUp ? (
              'Create Account'
            ) : (
              'Sign In'
            )}
          </Button>

          {!isSignUp && (
            <div className="relative flex py-3 items-center">
              <div className="flex-grow border-t border-border/80"></div>
              <span className="flex-shrink mx-4 text-[10px] text-muted-foreground uppercase tracking-widest">Or</span>
              <div className="flex-grow border-t border-border/80"></div>
            </div>
          )}

          {!isSignUp && (
            <Button
              type="button"
              variant="outline"
              onClick={handleDemoLogin}
              className="w-full h-10 border-dashed border-primary/40 text-primary hover:bg-primary/5 hover:border-primary/60 transition-all font-medium group"
              disabled={isLoading}
            >
              <span className="flex items-center gap-2">
                ⚡ Quick Demo Access
              </span>
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}
