import React from 'react';

export default function MetricCard({ title, value, subtitle, icon: Icon, color = 'blue' }) {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50 text-blue-600 border-blue-100',
      badge: 'text-blue-700 bg-blue-50',
    },
    emerald: {
      bg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      badge: 'text-emerald-700 bg-emerald-50',
    },
    indigo: {
      bg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      badge: 'text-indigo-700 bg-indigo-50',
    },
    amber: {
      bg: 'bg-amber-50 text-amber-600 border-amber-100',
      badge: 'text-amber-700 bg-amber-50',
    },
    rose: {
      bg: 'bg-rose-50 text-rose-600 border-rose-100',
      badge: 'text-rose-700 bg-rose-50',
    }
  };

  const currentTheme = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold tracking-wide text-slate-500 uppercase">{title}</span>
        {Icon && (
          <div className={`p-2.5 rounded-xl border ${currentTheme.bg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <h3 className="text-3xl font-extrabold tracking-tight text-slate-900">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </h3>
      </div>
      {subtitle && (
        <p className="mt-2 text-xs font-medium text-slate-500">
          {subtitle}
        </p>
      )}
    </div>
  );
}

