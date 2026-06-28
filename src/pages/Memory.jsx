import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Database, CheckCircle2, XCircle, Edit3, BookOpen, TrendingUp, Filter } from 'lucide-react';
import moment from 'moment';

export default function Memory() {
  const [records, setRecords] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('All');

  useEffect(() => {
    async function load() {
      const [mem, recs] = await Promise.all([
        base44.entities.MemoryRecord.list('-created_date', 50),
        base44.entities.Recommendation.list('-created_date', 50),
      ]);
      setRecords(mem);
      setRecommendations(recs);
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

  // Stats
  const accepted = recommendations.filter(r => r.status === 'Approved').length;
  const rejected = recommendations.filter(r => r.status === 'Rejected').length;
  const modified = recommendations.filter(r => r.status === 'Modified').length;
  const total = recommendations.length;
  const successRate = total > 0 ? Math.round((accepted / total) * 100) : 0;

  const filtered = typeFilter === 'All' ? records : records.filter(r => r.record_type === typeFilter);

  const DECISION_ICON = {
    Approved: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
    Rejected: <XCircle className="w-4 h-4 text-red-500" />,
    Modified: <Edit3 className="w-4 h-4 text-amber-500" />,
    'N/A': <BookOpen className="w-4 h-4 text-slate-400" />,
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Memory Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">Platform learning history and decision memory</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MemKpiCard label="Total Recommendations" value={total} icon={Database} />
        <MemKpiCard label="Accepted" value={accepted} icon={CheckCircle2} color="emerald" />
        <MemKpiCard label="Rejected" value={rejected} icon={XCircle} color="red" />
        <MemKpiCard label="Modified" value={modified} icon={Edit3} color="amber" />
        <MemKpiCard label="Success Rate" value={`${successRate}%`} icon={TrendingUp} color="violet" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-slate-400" />
        {['All', 'Recommendation', 'Decision', 'Interaction', 'Outcome', 'Learning'].map(t => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              typeFilter === t
                ? 'bg-violet-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Records */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <Database className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No memory records yet. The platform learns from each analysis and decision.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(r => (
            <div key={r.id} className="bg-white rounded-xl border border-slate-100 px-5 py-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {DECISION_ICON[r.decision] || DECISION_ICON['N/A']}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-800">{r.title}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.record_type === 'Recommendation' ? 'bg-violet-50 text-violet-700' :
                        r.record_type === 'Decision' ? 'bg-emerald-50 text-emerald-700' :
                        r.record_type === 'Outcome' ? 'bg-blue-50 text-blue-700' :
                        'bg-slate-50 text-slate-600'
                      }`}>{r.record_type}</span>
                    </div>
                    {r.customer_name && <p className="text-xs text-violet-600 mt-0.5">{r.customer_name}</p>}
                    {r.content && <p className="text-sm text-slate-500 mt-1 line-clamp-2">{r.content}</p>}
                    {(r.tags || []).length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {r.tags.map((t, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded bg-slate-100 text-xs text-slate-500">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-xs text-slate-400 flex-shrink-0">{moment(r.created_date).fromNow()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MemKpiCard({ label, value, icon: Icon, color = 'slate' }) {
  const bgMap = {
    slate: 'bg-slate-100', emerald: 'bg-emerald-100', red: 'bg-red-100',
    amber: 'bg-amber-100', violet: 'bg-violet-100',
  };
  const textMap = {
    slate: 'text-slate-600', emerald: 'text-emerald-600', red: 'text-red-600',
    amber: 'text-amber-600', violet: 'text-violet-600',
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-7 h-7 rounded-lg ${bgMap[color]} flex items-center justify-center`}>
          <Icon className={`w-3.5 h-3.5 ${textMap[color]}`} />
        </div>
        <span className="text-xs text-slate-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}