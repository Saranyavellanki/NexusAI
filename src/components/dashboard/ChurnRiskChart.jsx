import React from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';

export default function ChurnRiskChart({ customers }) {
  const data = [
    { name: 'Low', count: customers.filter(c => c.churn_risk === 'Low').length, color: '#10b981' },
    { name: 'Medium', count: customers.filter(c => c.churn_risk === 'Medium').length, color: '#f59e0b' },
    { name: 'High', count: customers.filter(c => c.churn_risk === 'High').length, color: '#f97316' },
    { name: 'Critical', count: customers.filter(c => c.churn_risk === 'Critical').length, color: '#ef4444' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <h3 className="text-sm font-semibold text-slate-800 mb-4">Churn Risk Breakdown</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize={32}>
            <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(val) => [`${val} customers`]} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {data.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}