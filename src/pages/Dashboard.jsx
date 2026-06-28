import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Users, HeartPulse, AlertTriangle, TrendingDown, Zap } from 'lucide-react';
import KpiCard from '@/components/dashboard/KpiCard';
import HealthDistributionChart from '@/components/dashboard/HealthDistributionChart';
import ChurnRiskChart from '@/components/dashboard/ChurnRiskChart';
import HealthBadge from '@/components/shared/HealthBadge';
import RiskBadge from '@/components/shared/RiskBadge';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [customers, setCustomers] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [custs, recs] = await Promise.all([
        base44.entities.Customer.list(),
        base44.entities.Recommendation.list('-created_date', 10),
      ]);
      setCustomers(custs);
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

  const healthy = customers.filter(c => c.health_score >= 70).length;
  const atRisk = customers.filter(c => c.churn_risk === 'High' || c.churn_risk === 'Critical').length;
  const churning = customers.filter(c => c.journey_stage === 'Churning').length;
  const activeRecs = recommendations.filter(r => r.status === 'Pending').length;

  const urgentCustomers = [...customers]
    .sort((a, b) => a.health_score - b.health_score)
    .slice(0, 5);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Decision Intelligence</h1>
        <p className="text-sm text-slate-500 mt-0.5">Customer Success Command Center</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard label="Total Customers" value={customers.length} icon={Users} color="violet" />
        <KpiCard label="Healthy" value={healthy} subtitle={`${Math.round((healthy / customers.length) * 100)}% of portfolio`} icon={HeartPulse} color="emerald" />
        <KpiCard label="At Risk" value={atRisk} icon={AlertTriangle} color="amber" />
        <KpiCard label="Churn Predicted" value={churning} icon={TrendingDown} color="rose" />
        <KpiCard label="Active Actions" value={activeRecs} subtitle="Pending approval" icon={Zap} color="sky" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HealthDistributionChart customers={customers} />
        <ChurnRiskChart customers={customers} />
      </div>

      {/* Urgent Customers */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-800">Customers Needing Attention</h3>
          <Link to="/customers" className="text-xs font-medium text-violet-600 hover:text-violet-700">View all →</Link>
        </div>
        <div className="space-y-2">
          {urgentCustomers.map(c => (
            <Link
              key={c.id}
              to={`/customers/${c.id}`}
              className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600">
                  {c.company_name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800 group-hover:text-violet-700 transition-colors">{c.company_name}</p>
                  <p className="text-xs text-slate-400">{c.journey_stage} · ${c.mrr?.toLocaleString()}/mo</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <HealthBadge score={c.health_score} />
                <RiskBadge level={c.churn_risk} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800">Recent Recommendations</h3>
            <Link to="/recommendations" className="text-xs font-medium text-violet-600 hover:text-violet-700">View all →</Link>
          </div>
          <div className="space-y-2">
            {recommendations.slice(0, 4).map(r => (
              <div key={r.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50/50">
                <div>
                  <p className="text-sm font-medium text-slate-800">{r.title}</p>
                  <p className="text-xs text-slate-400">{r.customer_name} · {r.priority} priority</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  r.status === 'Pending' ? 'bg-amber-50 text-amber-700' :
                  r.status === 'Approved' ? 'bg-emerald-50 text-emerald-700' :
                  r.status === 'Rejected' ? 'bg-red-50 text-red-700' :
                  'bg-slate-100 text-slate-600'
                }`}>{r.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}