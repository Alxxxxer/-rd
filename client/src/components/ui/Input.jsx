import React, { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  type = 'text',
  error,
  icon: Icon,
  className = '',
  id,
  ...props
}, ref) => {
  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold uppercase tracking-wider text-slate-400 font-sans"
        >
          {label}
        </label>
      )}
      <div className="relative rounded-lg shadow-sm">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Icon size={18} className="transition-colors duration-300 group-focus-within:text-brand-400" />
          </div>
        )}
        <input
          ref={ref}
          type={type}
          id={id}
          className={`
            block w-full bg-slate-900/60 border rounded-lg text-sm text-slate-100 font-sans input-glow transition-all duration-300
            ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-3
            ${error ? 'border-red-900/50 focus:border-red-500 focus:ring-red-500/10' : 'border-slate-800 focus:border-brand-500/50'}
            placeholder-slate-600
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-red-400 mt-1 font-sans animate-fade-in">
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
