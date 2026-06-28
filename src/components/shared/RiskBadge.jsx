import React from 'react';

const STYLES = {
  Low: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Medium: 'bg-amber-50 text-amber-700 ring-amber-200',
  High: 'bg-orange-50 text-orange-700 ring-orange-200',
  Critical: 'bg-red-50 text-red-700 ring-red-200',
};

export default function RiskBadge({ level }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ${STYLES[level] || STYLES.Medium}`}>
      {level}
    </span>
  );
}