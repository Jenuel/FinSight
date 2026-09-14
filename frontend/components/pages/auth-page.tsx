'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSignIn, useSignUp } from '@clerk/nextjs';
import { IS_API_MODE } from '@/lib/services/data-service';
import { TrendingUp, ShieldCheck, Zap, Sparkles, Mail, Lock, User, ArrowRight } from 'lucide-react';

interface AuthPageProps {
  onLoginSuccess: (email: string) => void;
}

const DEMO_EMAIL = 'demo@finsight.com';

export function AuthPage({ onLoginSuccess }: AuthPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');

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

    try {
      if (isSignUp) {
        if (!signUp) return;

        const { error: signUpError } = await signUp.password({
          emailAddress: email,
          password,
          firstName: name,
        });

        if (signUpError) {
          setError(signUpError.longMessage || 'Sign-up failed. Please try again.');
          return;
        }

        const { error: sendError } = await signUp.verifications.sendEmailCode();
        if (sendError) {
          setError(sendError.longMessage || 'Failed to send verification email.');
          return;
        }

        setPendingVerification(true);
      } else {
        if (!signIn) return;

        const { error: signInError } = await signIn.password({
          identifier: email,
          password,
        });

        if (signInError) {
          setError(signInError.longMessage || 'Invalid email or password.');
          return;
        }

        if (signIn.status === 'complete') {
          const { error: finalizeError } = await signIn.finalize();
          if (finalizeError) {
            setError(finalizeError.longMessage || 'Failed to start session.');
            return;
          }
          onLoginSuccess(email);
        } else {
          setError('Sign-in could not be completed. Additional steps may be required.');
        }
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setIsLoading(true);
    onLoginSuccess(DEMO_EMAIL);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-background">
      {/* Main Container */}
      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        {/* Brand Card */}
        <div className="glass-card rounded-3xl p-8 sm:p-10 border border-border/80 shadow-2xl relative overflow-hidden">
          {/* Logo Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-14 h-14 bg-card border border-border/80 rounded-2xl flex items-center justify-center text-foreground shadow-xs mb-4">
              <TrendingUp className="w-7 h-7 text-emerald-500" />
            </div>

            <h1 className="text-2xl font-extrabold font-heading tracking-tight text-foreground">
              FinSight
            </h1>
            <p className="text-xs text-muted-foreground mt-1 max-w-[260px]">
              Intelligent wealth telemetry & frictionless cashflow tracking
            </p>
          </div>

          {!IS_API_MODE ? (
            /* Local Mode: Instant 1-Click Interactive Demo */
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-secondary/40 border border-border/50 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <span>Interactive Local Sandbox</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Experience a fully pre-seeded workspace with rich accounts, real-time analytics, and instant NLP transaction logging.
                </p>
                <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-1 border-t border-border/30">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> 100% Private
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-500" /> Zero Latency
                  </span>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleDemoLogin}
                className="w-full h-11 text-sm font-semibold gap-2 shadow-xs"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                    Launching Sandbox...
                  </span>
                ) : (
                  <>
                    <span>Launch FinSight Demo</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          ) : !pendingVerification ? (
            <>
              {/* Tab Switcher */}
              <div className="grid grid-cols-2 p-1 bg-secondary/50 rounded-xl mb-6 border border-border/40">
                <button
                  type="button"
                  onClick={() => { setIsSignUp(false); setError(''); }}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    !isSignUp
                      ? 'bg-card text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setIsSignUp(true); setError(''); }}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    isSignUp
                      ? 'bg-card text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Register
                </button>
              </div>

              {/* Auth Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-xl animate-fade-in font-medium">
                    {error}
                  </div>
                )}

                {isSignUp && (
                  <Input
                    label="Full Name"
                    type="text"
                    placeholder="Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                    icon={<User className="w-4 h-4" />}
                  />
                )}

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  icon={<Mail className="w-4 h-4" />}
                />

                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  icon={<Lock className="w-4 h-4" />}
                />

                <Button type="submit" className="w-full h-11 mt-2 text-sm font-semibold" disabled={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                      Processing...
                    </span>
                  ) : isSignUp ? (
                    'Create Account'
                  ) : (
                    'Sign In to FinSight'
                  )}
                </Button>
              </form>

              {/* Instant Guest / Demo Mode Button */}
              <div className="pt-4 border-t border-border/40 text-center">
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  className="text-xs font-semibold text-emerald-500 hover:text-emerald-400 transition-colors flex items-center justify-center gap-1.5 mx-auto cursor-pointer p-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Preview Design as Guest (Instant Demo)</span>
                </button>
              </div>
            </>
          ) : (
            /* OTP Verification */
            <div className="space-y-4 animate-fade-in">
              <div className="text-center mb-6">
                <h3 className="text-base font-bold text-foreground mb-1">Verify your email</h3>
                <p className="text-xs text-muted-foreground">
                  We sent a 6-digit code to <span className="font-semibold text-foreground">{email}</span>
                </p>
              </div>

              <form onSubmit={handleVerifyOTP} className="space-y-4">
                {error && (
                  <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-xl animate-fade-in font-medium">
                    {error}
                  </div>
                )}

                <Input
                  label="Verification Code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={isLoading}
                  maxLength={6}
                />

                <Button type="submit" className="w-full h-11 text-sm font-semibold mt-2" disabled={isLoading || code.length < 6}>
                  {isLoading ? 'Verifying...' : 'Confirm Verification'}
                </Button>

                <button
                  type="button"
                  onClick={() => setPendingVerification(false)}
                  className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center cursor-pointer pt-2"
                >
                  ← Back to Sign Up
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
