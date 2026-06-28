import React from 'react';

const STYLES = {
  Positive: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Neutral: 'bg-slate-50 text-slate-600 ring-slate-200',
  Negative: 'bg-red-50 text-red-700 ring-red-200',
  Mixed: 'bg-amber-50 text-amber-700 ring-amber-200',
};

export default function SentimentBadge({ sentiment }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ${STYLES[sentiment] || STYLES.Neutral}`}>
      {sentiment}
    </span>
  );
}