import React from 'react';

export default function KpiCard({ label, value, subtitle, icon: Icon, color = 'violet' }) {
  const colorMap = {
    violet: 'from-violet-500 to-indigo-600',
    emerald: 'from-emerald-500 to-teal-600',
    amber: 'from-amber-500 to-orange-600',
    rose: 'from-rose-500 to-pink-600',
    sky: 'from-sky-500 to-cyan-600',
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}