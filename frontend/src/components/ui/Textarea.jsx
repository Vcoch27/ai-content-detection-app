import React from 'react';

export const Textarea = ({
  label,
  error,
  value,
  onChange,
  placeholder,
  rows = 5,
  className = '',
  required = false,
  ...props
}) => {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-semibold text-slate-700">
          {label}
          {required && <span className="ml-1 text-rose-500">*</span>}
        </label>
      )}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className={`w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none ${className}`}
        {...props}
      />
      {error && <span className="text-sm text-rose-600">{error}</span>}
    </div>
  );
};
