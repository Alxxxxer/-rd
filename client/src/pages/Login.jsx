import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await login(email, password);
      // Redirect to dashboard page upon successful login
      navigate('/');
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
            <ShieldCheck size={28} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Sign in to Sales<span className="text-brand-500">CRM</span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Enter your credentials to access the console desk
          </p>
        </div>

        <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 md:p-8 shadow-sm">
          {error && (
            <div className="mb-5 p-3.5 rounded bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs flex items-start gap-2 animate-fade-in text-left">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
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

            <div className="space-y-1">
              <div className="flex justify-between items-center px-0.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-sans">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
                >
                  Forgot?
                </Link>
              </div>
              <Input
                type="password"
                id="password"
                placeholder="••••••••"
                icon={Lock}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-2.5 mt-2 font-semibold text-xs uppercase tracking-wider"
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </form>
        </Card>

        {/* Footer info text */}
        <p className="text-center text-[10px] text-zinc-400 dark:text-zinc-500 leading-normal">
          Authorized operations only. System actions and IP accesses are monitored and logged for security compliance.
        </p>
      </div>
    </div>
  );
};

export default Login;
