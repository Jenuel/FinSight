'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSignIn, useSignUp } from '@clerk/nextjs';

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
  
  // States for Auth Switch and OTP
  const [useClerkAuth, setUseClerkAuth] = useState(true);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');

  // Clerk v7 signal-based hooks — returns { signIn/signUp, fetchStatus, errors }
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUp) return;
    
    setError('');
    setIsLoading(true);
    
    try {
      const { error: verifyError } = await signUp.verifications.verifyEmailCode({ code });
      if (verifyError) {
        setError(verifyError.longMessage || 'Invalid verification code.');
        return;
      }

      if (signUp.status === 'complete') {
        const { error: finalizeError } = await signUp.finalize();
        if (finalizeError) {
          setError(finalizeError.longMessage || 'Failed to finalize sign-up.');
          return;
        }
        onLoginSuccess(email);
      } else {
        setError('Verification failed. Please try again.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (isSignUp && !name && !pendingVerification) {
      setError('Please enter your name');
      return;
    }

    setIsLoading(true);

    if (useClerkAuth) {
      try {
        if (isSignUp) {
          if (!signUp) return;

          // Clerk v7: use signUp.password() for email+password sign-up
          const { error: signUpError } = await signUp.password({
            emailAddress: email,
            password,
            firstName: name,
          });

          if (signUpError) {
            setError(signUpError.longMessage || 'Sign-up failed. Please try again.');
            setIsLoading(false);
            return;
          }

          // Trigger email verification code
          const { error: sendError } = await signUp.verifications.sendEmailCode();
          if (sendError) {
            setError(sendError.longMessage || 'Failed to send verification email.');
            setIsLoading(false);
            return;
          }

          setPendingVerification(true);
          setIsLoading(false);
        } else {
          if (!signIn) return;

          // Clerk v7: use signIn.password() for email+password sign-in
          const { error: signInError } = await signIn.password({
            identifier: email,
            password,
          });

          if (signInError) {
            setError(signInError.longMessage || 'Invalid email or password.');
            setIsLoading(false);
            return;
          }

          if (signIn.status === 'complete') {
            const { error: finalizeError } = await signIn.finalize();
            if (finalizeError) {
              setError(finalizeError.longMessage || 'Failed to start session.');
              setIsLoading(false);
              return;
            }
            onLoginSuccess(email);
          } else {
            setError('Sign-in could not be completed. Additional steps may be required.');
            setIsLoading(false);
          }
        }
      } catch {
        setError('Something went wrong. Please try again.');
        setIsLoading(false);
      }
    } else {
      // Mock LocalStorage Auth Flow
      setTimeout(() => {
        try {
          if (isSignUp) {
            const users: { name: string; email: string; password: string }[] = JSON.parse(
              localStorage.getItem('finsight-users') || '[]'
            );
            if (users.some((u) => u.email === email)) {
              setError('An account with this email already exists.');
              setIsLoading(false);
              return;
            }
            users.push({ name, email, password });
            localStorage.setItem('finsight-users', JSON.stringify(users));
            onLoginSuccess(email);
          } else {
            if (email === 'demo@finsight.com' && password === 'password') {
              onLoginSuccess(email);
              return;
            }
            const users: { email: string; password: string }[] = JSON.parse(
              localStorage.getItem('finsight-users') || '[]'
            );
            const user = users.find((u) => u.email === email && u.password === password);
            if (!user) {
              setError('Invalid email or password');
              setIsLoading(false);
              return;
            }
            onLoginSuccess(email);
          }
        } catch {
          setError('Something went wrong. Please try again.');
          setIsLoading(false);
        }
      }, 1000);
    }
  };

  const handleDemoLogin = () => {
    if (useClerkAuth) {
      setError('Demo login is only available in Local Storage mode.');
      return;
    }
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
        
        {/* Auth Switch Toggle */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">
            {useClerkAuth ? 'Clerk Auth' : 'Mock Auth'}
          </span>
          <button
            type="button"
            onClick={() => {
              setUseClerkAuth(!useClerkAuth);
              setError('');
              setPendingVerification(false);
            }}
            className={`w-10 h-5 rounded-full p-1 transition-colors ${useClerkAuth ? 'bg-primary' : 'bg-muted-foreground/30'}`}
          >
            <div className={`w-3 h-3 rounded-full bg-white transition-transform ${useClerkAuth ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8 mt-2">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 mb-3">
            <svg className="w-7 h-7 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">FinSight</h2>
          <p className="text-sm text-muted-foreground mt-1">Pragmatic financial intelligence</p>
        </div>

        {!pendingVerification ? (
          <>
            {/* Tab switcher */}
            <div className="flex border-b border-border mb-6">
              <button
                type="button"
                onClick={() => { setIsSignUp(false); setError(''); }}
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
                onClick={() => { setIsSignUp(true); setError(''); }}
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
                  disabled={isLoading || useClerkAuth}
                >
                  <span className="flex items-center gap-2">
                    ⚡ Quick Demo Access {useClerkAuth && '(Mock Only)'}
                  </span>
                </Button>
              )}
            </form>
          </>
        ) : (
          /* OTP Verification Form */
          <div className="space-y-4 animate-fade-in">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-1">Verify your email</h3>
              <p className="text-sm text-muted-foreground">
                We&apos;ve sent a code to <span className="font-medium text-foreground">{email}</span>
              </p>
            </div>
            
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              {error && (
                <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-lg animate-shake">
                  {error}
                </div>
              )}
              
              <div className="space-y-1.5">
                <Input
                  label="Verification Code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={isLoading}
                  maxLength={6}
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                />
              </div>
              
              <Button type="submit" className="w-full h-10 mt-4 font-medium" disabled={isLoading || code.length < 6}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Verifying...
                  </span>
                ) : (
                  'Verify Code'
                )}
              </Button>
              
              <button
                type="button"
                onClick={() => setPendingVerification(false)}
                className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors mt-2 text-center"
              >
                Back to Sign Up
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
