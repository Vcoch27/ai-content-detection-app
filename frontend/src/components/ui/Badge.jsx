import React from 'react';

/**
 * Reusable Badge Component
 */
export const Badge = ({ children, variant = 'primary', className = '' }) => {
  const variantClasses = {
    primary: 'bg-blue-100 text-blue-700 ring-blue-200',
    success: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
    error: 'bg-rose-100 text-rose-700 ring-rose-200',
    warning: 'bg-amber-100 text-amber-800 ring-amber-200',
    gray: 'bg-slate-100 text-slate-700 ring-slate-200',
    dark: 'bg-slate-900 text-white ring-slate-900',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-3 py-1 rounded-full ring-1
        text-xs font-semibold
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
};
