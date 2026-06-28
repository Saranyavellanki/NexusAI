import React from 'react';

export default function HealthBadge({ score }) {
  let bg, text, ring;
  if (score >= 70) {
    bg = 'bg-emerald-50'; text = 'text-emerald-700'; ring = 'ring-emerald-200';
  } else if (score >= 40) {
    bg = 'bg-amber-50'; text = 'text-amber-700'; ring = 'ring-amber-200';
  } else {
    bg = 'bg-red-50'; text = 'text-red-700'; ring = 'ring-red-200';
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ${bg} ${text} ${ring}`}>
      {score}
    </span>
  );
}