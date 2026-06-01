import React from 'react';

const Card = ({
  children,
  className = '',
  hoverGlow = false,
  ...props
}) => {
  return (
    <div
      className={`
        rounded-xl glassmorphism-card p-6 overflow-hidden relative
        ${hoverGlow ? 'hover:shadow-glow' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
