import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Search, Filter } from 'lucide-react';
import HealthBadge from '@/components/shared/HealthBadge';
import RiskBadge from '@/components/shared/RiskBadge';
import SentimentBadge from '@/components/shared/SentimentBadge';
import moment from 'moment';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('All');

  useEffect(() => {
    async function load() {
      const data = await base44.entities.Customer.list();
      setCustomers(data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  const filtered = customers.filter(c => {
    const matchSearch = c.company_name.toLowerCase().includes(search.toLowerCase()) ||
      c.contact_name.toLowerCase().includes(search.toLowerCase());
    const matchRisk = riskFilter === 'All' || c.churn_risk === riskFilter;
    return matchSearch && matchRisk;
  });

  const TREND_ICONS = {
    Increasing: '↑',
    Stable: '→',
    Declining: '↓',
    Critical: '⚠',
  };

  const TREND_COLORS = {
    Increasing: 'text-emerald-600',
    Stable: 'text-slate-500',
    Declining: 'text-orange-600',
    Critical: 'text-red-600',
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
        <p className="text-sm text-slate-500 mt-0.5">{customers.length} accounts in portfolio</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search customers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          {['All', 'Low', 'Medium', 'High', 'Critical'].map(level => (
            <button
              key={level}
              onClick={() => setRiskFilter(level)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                riskFilter === level
                  ? 'bg-violet-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Health</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sentiment</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Usage</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Renewal</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Churn Risk</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Stage</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4">
                    <Link to={`/customers/${c.id}`} className="flex items-center gap-3 group">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-sm font-bold text-slate-600">
                        {c.company_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 group-hover:text-violet-700 transition-colors">{c.company_name}</p>
                        <p className="text-xs text-slate-400">{c.contact_name} · ${c.mrr?.toLocaleString()}/mo</p>
                      </div>
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-center"><HealthBadge score={c.health_score} /></td>
                  <td className="py-3 px-4 text-center"><SentimentBadge sentiment={c.sentiment} /></td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-sm font-medium ${TREND_COLORS[c.usage_trend]}`}>
                      {TREND_ICONS[c.usage_trend]} {c.usage_trend}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-xs text-slate-600">
                    {c.renewal_date ? moment(c.renewal_date).format('MMM D, YYYY') : '—'}
                  </td>
                  <td className="py-3 px-4 text-center"><RiskBadge level={c.churn_risk} /></td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">{c.journey_stage}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-slate-400">No customers match your search.</div>
        )}
      </div>
    </div>
  );
}