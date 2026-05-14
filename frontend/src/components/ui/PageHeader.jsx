import React from 'react';
import { Badge } from './Badge';

export const PageHeader = ({ badge, title, subtitle, children }) => {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        {badge && <Badge variant="primary" className="mb-3">{badge}</Badge>}
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle mt-2">{subtitle}</p>}
      </div>
      {children && <div className="flex shrink-0 items-center gap-3">{children}</div>}
    </div>
  );
};
