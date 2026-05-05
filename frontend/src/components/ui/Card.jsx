import React from 'react';

/**
 * Reusable Card Component
 */
export const Card = ({ children, className = '', padding = 'md', shadow = 'md' }) => {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const shadowClasses = {
    none: 'shadow-none',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
  };

  return (
    <div
      className={`
        bg-white rounded-xl border border-gray-100
        ${paddingClasses[padding]}
        ${shadowClasses[shadow]}
        transition-all hover:shadow-lg
        ${className}
      `}
    >
      {children}
    </div>
  );
};
