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
          className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-sans"
        >
          {label}
        </label>
      )}
      <div className="relative rounded-md shadow-subtle">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
            <Icon size={16} className="transition-colors duration-150 group-focus-within:text-brand-500" />
          </div>
        )}
        <input
          ref={ref}
          type={type}
          id={id}
          className={`
            block w-full bg-white dark:bg-zinc-950 border rounded-md text-sm text-zinc-950 dark:text-zinc-100 font-sans transition-all duration-150
            ${Icon ? 'pl-9' : 'pl-3'} pr-3 py-2.5
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/10' : 'border-zinc-200 dark:border-zinc-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'}
            placeholder-zinc-400 dark:placeholder-zinc-600
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-red-500 dark:text-red-400 mt-1 font-sans animate-fade-in">
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
