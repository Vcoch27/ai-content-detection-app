import React from 'react';

/**
 * Reusable Button Component
 */
export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  className = '',
  ...props
}) => {
  const variantClasses = {
    primary: 'bg-blue-600 text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700',
    secondary: 'border border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-50',
    danger: 'bg-rose-600 text-white shadow-sm shadow-rose-600/20 hover:bg-rose-700',
    ghost: 'bg-transparent text-blue-700 hover:bg-blue-50',
    subtle: 'bg-slate-100 text-slate-800 hover:bg-slate-200',
  };

  const sizeClasses = {
    sm: 'h-9 px-3 text-sm rounded-xl',
    md: 'h-10 px-4 text-sm rounded-xl',
    lg: 'h-12 px-5 text-base rounded-2xl',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 whitespace-nowrap
        font-semibold transition-all duration-200
        hover:-translate-y-0.5 hover:shadow-md
        disabled:opacity-50 disabled:cursor-not-allowed
        disabled:hover:translate-y-0 disabled:hover:shadow-none
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabled || loading ? 'opacity-60' : ''}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <div className="animate-spin h-4 w-4 border-2 border-current border-r-transparent rounded-full" />
      )}
      {children}
    </button>
  );
};
