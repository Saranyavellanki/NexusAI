import React from 'react';

export default function ConfidenceBar({ score, size = 'md' }) {
  let color;
  if (score >= 75) color = 'bg-emerald-500';
  else if (score >= 50) color = 'bg-amber-500';
  else color = 'bg-red-500';

  const h = size === 'sm' ? 'h-1.5' : 'h-2';

  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 ${h} bg-slate-100 rounded-full overflow-hidden`}>
        <div className={`${h} ${color} rounded-full transition-all duration-500`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-semibold text-slate-600 tabular-nums w-8 text-right">{score}%</span>
    </div>
  );
}