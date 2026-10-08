import React from 'react';

export default function LoadingSpinner({ text = 'Loading warehouse data...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-sky-600 animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-sky-100"></div>
        </div>
      </div>
      <p className="mt-4 text-sm font-medium text-slate-600 tracking-wide animate-pulse">{text}</p>
    </div>
  );
}

