import React from 'react';

const Card = ({
  children,
  className = '',
  hoverEffect = false,
  ...props
}) => {
  return (
    <div
      className={`
        bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 relative overflow-hidden transition-all duration-150 shadow-subtle
        ${hoverEffect ? 'hover:border-zinc-350 dark:hover:border-zinc-750 hover:shadow-subtle' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
