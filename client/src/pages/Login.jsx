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
      // Automatically redirect to the home dashboard page upon successful login
      navigate('/');
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden">
      {/* Dynamic atmospheric background glow circles */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-brand-600/10 blur-[100px] animate-glow" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-indigo-600/10 blur-[100px] animate-glow" style={{ animationDelay: '2s' }} />

      <div className="w-full max-w-md z-10">
        {/* CRM Branding header */}
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 mb-2">
            <ShieldCheck size={36} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Sales<span className="text-gradient">CRM</span>
          </h1>
          <p className="text-sm text-slate-400">
            Enterprise Sales Operations & Analytics
          </p>
        </div>

        <Card className="shadow-glass border-slate-800/80">
          <div className="mb-6 text-left">
            <h2 className="text-xl font-bold text-slate-100">Welcome Back</h2>
            <p className="text-xs text-slate-400 mt-1">
              Sign in with your credentials to access the CRM console.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-950/20 border border-red-900/30 text-red-400 text-sm flex items-start gap-2.5 animate-fade-in text-left">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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

            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-0.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 font-sans">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-brand-400 hover:text-brand-300 transition-colors"
                >
                  Forgot Password?
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
              className="w-full py-3.5 mt-2"
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </form>
        </Card>

        {/* Console footer hints */}
        <p className="text-center text-xs text-slate-500 mt-6">
          Authorized users only. Activity logs are recorded.
        </p>
      </div>
    </div>
  );
};

export default Login;
