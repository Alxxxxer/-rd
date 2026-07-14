import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ShieldCheck, AlertCircle, Eye, EyeOff, Zap, BarChart2, Users, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const FEATURES = [
  {
    icon: BarChart2,
    title: 'Real-time Pipeline',
    desc: 'Track leads, conversions, and revenue from one command center.'
  },
  {
    icon: Users,
    title: 'Team Performance',
    desc: 'Monitor executive rankings and delegate network leaderboards.'
  },
  {
    icon: GraduationCap,
    title: 'Campus Delegates',
    desc: 'Import and manage college outreach contacts from Google Sheets.'
  }
];

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-zinc-950 transition-colors duration-150">

      {/* LEFT: Branding & Feature Panel */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] bg-zinc-900 dark:bg-zinc-900 flex-col justify-between p-10 xl:p-14 relative overflow-hidden">
        {/* Background grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
        {/* Gradient glow */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-brand-500/10 blur-[100px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-indigo-500/10 blur-[100px]" />

        {/* Brand Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-brand-500/10 border border-brand-500/20">
              <ShieldCheck size={22} className="text-brand-400" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-white">
              Sales<span className="text-brand-400">CRM</span>
            </span>
          </div>
          <p className="mt-3 text-sm text-zinc-500 font-medium leading-relaxed">
            Internal Sales Operations Platform
          </p>
        </div>

        {/* Hero Headline */}
        <div className="relative z-10 space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-4">
              <Zap size={10} />
              <span>Now Production Ready</span>
            </div>
            <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight tracking-tight">
              Your sales team's{' '}
              <span className="text-brand-400">command center</span>
            </h1>
            <p className="mt-4 text-zinc-400 leading-relaxed max-w-md">
              Manage leads, track campus delegates, monitor team performance, and close deals — all from one secure workspace.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="space-y-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3.5 group">
                <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-700/50 text-zinc-400 group-hover:border-brand-500/30 group-hover:text-brand-400 transition-colors flex-shrink-0 mt-0.5">
                  <Icon size={15} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-200">{title}</p>
                  <p className="text-xs text-zinc-500 leading-relaxed mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <div className="relative z-10">
          <p className="text-[10px] text-zinc-600 leading-relaxed">
            Authorized access only. All actions, sessions, and IP accesses are
            logged for security compliance.
          </p>
        </div>
      </div>

      {/* RIGHT: Login Form Panel */}
      <div className="w-full lg:w-1/2 xl:w-[45%] flex flex-col items-center justify-center px-6 py-12 sm:px-10 md:px-16 lg:px-12 xl:px-20">
        <div className="w-full max-w-sm space-y-8">

          {/* Mobile branding (visible only on small screens) */}
          <div className="flex lg:hidden items-center gap-2 justify-center">
            <div className="p-1.5 rounded-lg bg-brand-500/10 border border-brand-500/20">
              <ShieldCheck size={18} className="text-brand-500" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-zinc-900 dark:text-white">
              Sales<span className="text-brand-500">CRM</span>
            </span>
          </div>

          {/* Header */}
          <div className="text-left space-y-1.5">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Sign in to your account
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Enter your credentials below to access the dashboard
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs flex items-start gap-2 animate-fade-in">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
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
              autoComplete="email"
            />

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-sans">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  tabIndex={-1}
                  className="text-xs font-semibold text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              {/* Custom password field with show/hide toggle */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="block w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-sm text-zinc-950 dark:text-zinc-100 font-sans transition-all duration-150 pl-9 pr-10 py-2.5 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 placeholder-zinc-400 dark:placeholder-zinc-600 outline-none"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-2.5 mt-2 font-semibold text-sm"
              isLoading={isLoading}
              id="login-submit-btn"
            >
              {isLoading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>

          {/* Footer */}
          <p className="text-center text-[10px] text-zinc-400 dark:text-zinc-600 leading-relaxed">
            Only authorized personnel may access this system.
            <br />All sessions are monitored and recorded.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
