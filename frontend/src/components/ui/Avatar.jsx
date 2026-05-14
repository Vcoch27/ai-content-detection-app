import React from 'react';

/**
 * Reusable Avatar Component
 */
export const Avatar = ({ src, alt = 'User', size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  return (
    <img
      src={src}
      alt={alt}
      className={`
        rounded-full object-cover border border-white ring-2 ring-slate-200 shadow-sm
        ${sizeClasses[size]}
        ${className}
      `}
    />
  );
};
