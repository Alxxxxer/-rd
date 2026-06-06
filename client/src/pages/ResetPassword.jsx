import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, ShieldCheck, ShieldAlert, CheckCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const ResetPassword = () => {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Automatically pre-fill the token if present in URL query params
  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) {
      setToken(urlToken);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('A valid reset token is required');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000); // Redirect to login page after 3 seconds
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 py-12 transition-colors duration-150 relative">
      <div className="w-full max-w-sm space-y-6">
        
        {/* Branding header */}
        <div className="text-center flex flex-col items-center space-y-2">
          <div className="inline-flex items-center justify-center p-2 rounded bg-brand-500/10 text-brand-500 mb-1">
            <Lock size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Reset Password
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Define your new account password credentials
          </p>
        </div>

        <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 md:p-8 shadow-sm">
          {!success ? (
            <>
              <div className="mb-5 text-left space-y-1">
                <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Setup New Password</h2>
                <p className="text-xs text-zinc-450 dark:text-zinc-400">
                  Provide your secure reset token and your desired new password.
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
                  label="Reset Token"
                  type="text"
                  id="token"
                  placeholder="Paste your reset token here"
                  icon={ShieldCheck}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                  disabled={isLoading || !!searchParams.get('token')}
                />

                <Input
                  label="New Password"
                  type="password"
                  id="password"
                  placeholder="••••••••"
                  icon={Lock}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />

                <Input
                  label="Confirm New Password"
                  type="password"
                  id="confirmPassword"
                  placeholder="••••••••"
                  icon={Lock}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full py-2.5 mt-2 font-semibold text-xs uppercase tracking-wider"
                  isLoading={isLoading}
                >
                  Save Password
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center py-2 space-y-5">
              <div className="inline-flex items-center justify-center p-3 rounded-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/20 text-emerald-500 dark:text-emerald-400 mb-1">
                <CheckCircle size={32} />
              </div>

              <div className="space-y-2">
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Success!</h2>
                <p className="text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed">
                  Your password has been successfully reset. Redirecting you to the sign-in portal...
                </p>
              </div>

              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300 transition-colors inline-flex items-center gap-1.5"
                >
                  <ArrowLeft size={14} />
                  Proceed to Login Immediately
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

export default ResetPassword;
