import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function HealthDistributionChart({ customers }) {
  const segments = [
    { name: 'Healthy (70+)', value: customers.filter(c => c.health_score >= 70).length, color: '#10b981' },
    { name: 'At Risk (40–69)', value: customers.filter(c => c.health_score >= 40 && c.health_score < 70).length, color: '#f59e0b' },
    { name: 'Critical (<40)', value: customers.filter(c => c.health_score < 40).length, color: '#ef4444' },
  ].filter(s => s.value > 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <h3 className="text-sm font-semibold text-slate-800 mb-4">Health Distribution</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={segments} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={4} strokeWidth={0}>
              {segments.map((s, i) => <Cell key={i} fill={s.color} />)}
            </Pie>
            <Tooltip formatter={(val, name) => [`${val} customers`, name]} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-3 mt-2">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            {s.name} ({s.value})
          </div>
        ))}
      </div>
    </div>
  );
}