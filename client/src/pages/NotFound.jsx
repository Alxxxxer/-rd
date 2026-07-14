import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, AlertTriangle, ArrowLeft, Home } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-6 py-12 transition-colors duration-150 relative overflow-hidden">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.8) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />
      {/* Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-brand-500/5 blur-[100px]" />

      <div className="relative z-10 w-full max-w-md text-center space-y-6">
        {/* Brand */}
        <div className="flex items-center gap-2 justify-center mb-2">
          <div className="p-1.5 rounded-lg bg-brand-500/10 border border-brand-500/20">
            <ShieldCheck size={16} className="text-brand-500" />
          </div>
          <span className="text-sm font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Sales<span className="text-brand-500">CRM</span>
          </span>
        </div>

        {/* 404 Indicator */}
        <div className="space-y-3">
          <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
            <AlertTriangle size={32} />
          </div>
          <div>
            <p className="text-[80px] font-black text-zinc-100 dark:text-zinc-800 leading-none tracking-tighter select-none">
              404
            </p>
            <h1 className="-mt-4 text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Page Not Found
            </h1>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-xs mx-auto">
            The route you're looking for doesn't exist or you may not have permission to view it.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft size={15} />
            Go Back
          </button>

          <Link
            to="/"
            className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-brand-500 hover:bg-brand-600 text-sm font-semibold text-white transition-colors"
          >
            <Home size={15} />
            Back to Dashboard
          </Link>
        </div>

        {/* Help line */}
        <p className="text-[10px] text-zinc-400 dark:text-zinc-600">
          If you believe this is an error, please contact your system administrator.
        </p>
      </div>
    </div>
  );
};

export default NotFound;
