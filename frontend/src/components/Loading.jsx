import React from 'react';

const Loading = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6">
      <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      <p className="text-sm font-medium text-slate-600">Loading HyperID dashboard...</p>
    </div>
  );
};

export default Loading;
