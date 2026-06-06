import React from 'react';

const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md transition-all duration-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:focus:ring-brand-500/30 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none';

  const variants = {
    primary: 'bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white shadow-subtle border border-brand-600/10',
    secondary: 'bg-zinc-100 hover:bg-zinc-200 active:bg-zinc-300 text-zinc-900 border border-zinc-200/60 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:active:bg-zinc-600 dark:text-zinc-100 dark:border-zinc-700/60',
    outline: 'bg-transparent hover:bg-zinc-100 active:bg-zinc-200 dark:hover:bg-zinc-800/50 dark:active:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700',
    ghost: 'bg-transparent hover:bg-zinc-100 active:bg-zinc-200 dark:hover:bg-zinc-900 dark:active:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100',
    danger: 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-subtle border border-red-700/10 dark:bg-red-950/30 dark:hover:bg-red-900/40 dark:text-red-400 dark:border-red-900/30 dark:hover:border-red-800/40'
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      type={type}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
