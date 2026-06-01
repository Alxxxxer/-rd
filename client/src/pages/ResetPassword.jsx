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
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden">
      {/* Background radial atmosphere */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-brand-600/10 blur-[100px] animate-glow" />

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 mb-2">
            <Lock size={36} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Reset <span className="text-gradient">Password</span>
          </h1>
          <p className="text-sm text-slate-400">
            Define your new account password credentials
          </p>
        </div>

        <Card className="shadow-glass border-slate-800/80">
          {!success ? (
            <>
              <div className="mb-6 text-left">
                <h2 className="text-xl font-bold text-slate-100">Setup New Password</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Provide your secure reset token and your desired new password.
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-950/20 border border-red-900/30 text-red-400 text-sm flex items-start gap-2.5 animate-fade-in text-left">
                  <ShieldAlert size={18} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
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
                  className="w-full py-3.5 mt-2"
                  isLoading={isLoading}
                >
                  Save Password
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center py-4 space-y-6">
              <div className="inline-flex items-center justify-center p-4 rounded-full bg-green-950/20 border border-green-500/20 text-green-400 mb-2 animate-bounce">
                <CheckCircle size={44} />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-100">Success!</h2>
                <p className="text-sm text-slate-400 px-2 leading-relaxed">
                  Your password has been successfully reset. Redirecting you to the sign-in portal...
                </p>
              </div>

              <div className="border-t border-slate-800 pt-6">
                <Link
                  to="/login"
                  className="text-sm font-medium text-brand-400 hover:text-brand-300 transition-colors inline-flex items-center gap-2"
                >
                  <ArrowLeft size={16} />
                  Proceed to Login Immediately
                </Link>
              </div>
            </div>
          )}

          {!success && (
            <div className="border-t border-slate-800 pt-6 mt-6">
              <Link
                to="/login"
                className="text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors inline-flex items-center gap-2"
              >
                <ArrowLeft size={16} />
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
