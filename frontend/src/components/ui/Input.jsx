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
        <label className="text-sm font-semibold text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          px-4 py-2.5 rounded-lg border-2 transition-all
          ${error ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'}
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white focus:outline-none'}
          text-gray-900 placeholder-gray-400
          ${className}
        `}
        {...props}
      />
      {error && <span className="text-sm text-red-500">{error}</span>}
    </div>
  );
};
