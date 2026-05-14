import React from 'react';

/**
 * Reusable Input Component
 */
export const Input = ({
  label,
  error,
  placeholder,
  type = 'text',
  value,
  onChange,
  disabled = false,
  required = false,
  className = '',
  ...props
}) => {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-semibold text-slate-700">
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          h-11 px-4 rounded-xl border transition-all shadow-sm
          ${error ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-blue-500'}
          ${disabled ? 'bg-slate-100 cursor-not-allowed' : 'bg-white focus:outline-none'}
          text-slate-900 placeholder-slate-400
          ${className}
        `}
        {...props}
      />
      {error && <span className="text-sm text-rose-600">{error}</span>}
    </div>
  );
};
