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
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden">
      {/* Background radial atmosphere */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-brand-600/10 blur-[100px] animate-glow" />

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 mb-2">
            <Key size={36} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Forgot <span className="text-gradient">Password?</span>
          </h1>
          <p className="text-sm text-slate-400">
            Recover access to your SalesCRM account
          </p>
        </div>

        <Card className="shadow-glass border-slate-800/80">
          {!success ? (
            <>
              <div className="mb-6 text-left">
                <h2 className="text-xl font-bold text-slate-100">Reset Credentials</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Enter your registered email address. We will generate a secure reset link.
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-950/20 border border-red-900/30 text-red-400 text-sm flex items-start gap-2.5 animate-fade-in text-left">
                  <ShieldAlert size={18} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
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
                  className="w-full py-3.5"
                  isLoading={isLoading}
                >
                  Send Reset Link
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center py-4 space-y-6">
              <div className="inline-flex items-center justify-center p-4 rounded-full bg-green-950/20 border border-green-500/20 text-green-400 mb-2 animate-bounce">
                <CheckCircle size={44} />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-100">Check Email</h2>
                <p className="text-sm text-slate-400 px-2 leading-relaxed">
                  If your email matches an active account, a password reset token has been dispatched.
                </p>
              </div>

              {devToken && (
                <div className="p-4 rounded-lg bg-brand-950/20 border border-brand-500/20 text-left space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-brand-400 uppercase tracking-wide">
                      Local Seeding / Dev Token
                    </span>
                    <button
                      onClick={handleCopyToken}
                      className="text-xs font-medium text-brand-300 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      <Copy size={13} />
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <code className="block break-all bg-slate-950/80 p-2.5 rounded border border-slate-800 text-xs text-slate-300 select-all font-mono">
                    {devToken}
                  </code>
                  <p className="text-[10px] text-slate-500 italic">
                    Note: This token is only exposed in your current local development environment.
                  </p>
                  <Link
                    to={`/reset-password?token=${devToken}`}
                    className="block text-center text-xs font-bold bg-brand-600/40 hover:bg-brand-600/60 border border-brand-500/30 text-white py-2 rounded transition-all duration-300"
                  >
                    Proceed to Reset Page Directly
                  </Link>
                </div>
              )}

              <div className="border-t border-slate-800 pt-6">
                <Link
                  to="/login"
                  className="text-sm font-medium text-brand-400 hover:text-brand-300 transition-colors inline-flex items-center gap-2"
                >
                  <ArrowLeft size={16} />
                  Return to Login
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

export default ForgotPassword;
