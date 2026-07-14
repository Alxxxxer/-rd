import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, ShieldAlert, CheckCircle, Copy, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const ForgotPassword = () => {
  const { forgotPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [devToken, setDevToken] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please provide an email address');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);
    setDevToken(null);

    try {
      const response = await forgotPassword(email);
      setSuccess(true);
      // In development mode, the backend sends back the raw token for straightforward testing
      if (response.resetToken) {
        setDevToken(response.resetToken);
      }
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToken = () => {
    if (devToken) {
      navigator.clipboard.writeText(devToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 py-12 transition-colors duration-150 relative">
      <div className="w-full max-w-sm space-y-6">
        
        {/* Branding header */}
        <div className="text-center flex flex-col items-center space-y-2">
          <div className="inline-flex items-center justify-center p-2 rounded bg-brand-500/10 text-brand-500 mb-1">
            <Key size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Forgot Password
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Recover access to your SalesCRM account
          </p>
        </div>

        <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 md:p-8 shadow-sm">
          {!success ? (
            <>
              <div className="mb-5 text-left space-y-1">
                <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Reset Credentials</h2>
                <p className="text-xs text-zinc-450 dark:text-zinc-400">
                  Enter your registered email address below. We'll generate a secure password reset link.
                </p>
              </div>

              {error && (
                <div className="mb-5 p-3.5 rounded bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs flex items-start gap-2 animate-fade-in text-left">
                  <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Email Address"
                  type="email"
                  id="email"
                  placeholder="name@company.com"
                  icon={Mail}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full py-2.5 mt-2 font-semibold text-xs uppercase tracking-wider"
                  isLoading={isLoading}
                >
                  Send Reset Link
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center py-2 space-y-5">
              <div className="inline-flex items-center justify-center p-3 rounded-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/20 text-emerald-500 dark:text-emerald-400 mb-1">
                <CheckCircle size={32} />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Check Email</h2>
                <p className="text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed">
                  If your email matches an active account, a password reset token has been processed and dispatched.
                </p>
              </div>

              {/* Dev-only token helper — hidden in production builds */}
              {devToken && import.meta.env.DEV && (
                <div className="p-3.5 rounded border border-brand-200/50 dark:border-brand-800/40 bg-brand-50/10 dark:bg-brand-950/20 text-left space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                      Dev Testing Helper
                    </span>
                    <button
                      onClick={handleCopyToken}
                      className="text-[10px] font-semibold text-brand-600 dark:text-brand-300 hover:text-brand-800 dark:hover:text-white flex items-center gap-1 transition-colors"
                    >
                      <Copy size={11} />
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <code className="block break-all bg-zinc-100 dark:bg-zinc-950 p-2 rounded border border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-700 dark:text-zinc-300 select-all font-mono">
                    {devToken}
                  </code>
                  <Link
                    to={`/reset-password?token=${devToken}`}
                    className="block text-center text-xs font-semibold bg-brand-500 text-white hover:bg-brand-600 py-1.5 rounded transition-all"
                  >
                    Proceed to Reset Page Directly
                  </Link>
                </div>
              )}

              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300 transition-colors inline-flex items-center gap-1.5"
                >
                  <ArrowLeft size={14} />
                  Return to Login
                </Link>
              </div>
            </div>
          )}

          {!success && (
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 mt-4 text-center">
              <Link
                to="/login"
                className="text-xs font-medium text-zinc-550 dark:text-zinc-450 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors inline-flex items-center gap-1.5"
              >
                <ArrowLeft size={14} />
                Back to Login
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
