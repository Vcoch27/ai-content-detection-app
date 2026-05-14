import React from 'react';

export const Progress = ({ value = 0, className = '', indicatorClassName = '' }) => {
  const normalizedValue = Math.max(0, Math.min(Number(value) || 0, 100));

  return (
    <div className={`h-2.5 w-full overflow-hidden rounded-full bg-slate-100 ${className}`}>
      <div
        className={`h-full rounded-full bg-blue-600 transition-all duration-500 ${indicatorClassName}`}
        style={{ width: `${normalizedValue}%` }}
      />
    </div>
  );
};
