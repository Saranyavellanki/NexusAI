import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import ConfidenceBar from '@/components/shared/ConfidenceBar';
import { Link } from 'react-router-dom';
import moment from 'moment';

export default function Recommendations() {
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    async function load() {
      const data = await base44.entities.Recommendation.list('-created_date', 50);
      setRecs(data);
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

  const filtered = statusFilter === 'All' ? recs : recs.filter(r => r.status === statusFilter);

  const statusCounts = {
    All: recs.length,
    Pending: recs.filter(r => r.status === 'Pending').length,
    Approved: recs.filter(r => r.status === 'Approved').length,
    Rejected: recs.filter(r => r.status === 'Rejected').length,
    Modified: recs.filter(r => r.status === 'Modified').length,
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Recommendations</h1>
        <p className="text-sm text-slate-500 mt-0.5">AI-generated next best actions awaiting review</p>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 flex-wrap">
        {['All', 'Pending', 'Approved', 'Rejected', 'Modified'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === s
                ? 'bg-violet-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {s} ({statusCounts[s] || 0})
          </button>
        ))}
      </div>

      {/* Recommendation Cards */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <p className="text-sm text-slate-400">No recommendations yet. Run agent analysis on a customer to generate recommendations.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <div key={r.id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-sm font-bold text-slate-900">{r.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      r.priority === 'Critical' ? 'bg-red-50 text-red-700' :
                      r.priority === 'High' ? 'bg-orange-50 text-orange-700' :
                      r.priority === 'Medium' ? 'bg-amber-50 text-amber-700' :
                      'bg-slate-50 text-slate-600'
                    }`}>{r.priority}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      r.status === 'Pending' ? 'bg-amber-50 text-amber-700' :
                      r.status === 'Approved' ? 'bg-emerald-50 text-emerald-700' :
                      r.status === 'Rejected' ? 'bg-red-50 text-red-700' :
                      'bg-violet-50 text-violet-700'
                    }`}>{r.status}</span>
                  </div>
                  <Link to={`/customers/${r.customer_id}`} className="text-xs text-violet-600 hover:text-violet-700 font-medium">
                    {r.customer_name}
                  </Link>
                  {r.description && <p className="text-sm text-slate-500 mt-1 line-clamp-2">{r.description}</p>}
                </div>
                <div className="w-32 flex-shrink-0">
                  <p className="text-xs text-slate-500 mb-1">Confidence</p>
                  <ConfidenceBar score={r.confidence_score} size="sm" />
                  <p className="text-xs text-slate-400 mt-2">{moment(r.created_date).fromNow()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}