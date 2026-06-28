import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Play, Loader2, Calendar, DollarSign, Activity, Clock, Ticket, MessageSquare } from 'lucide-react';
import HealthBadge from '@/components/shared/HealthBadge';
import RiskBadge from '@/components/shared/RiskBadge';
import SentimentBadge from '@/components/shared/SentimentBadge';
import AgentTimeline from '@/components/customer/AgentTimeline';
import RecommendationPanel from '@/components/customer/RecommendationPanel';
import { runPipeline, saveRecommendation } from '@/lib/agentFramework';
import moment from 'moment';

export default function CustomerDetail() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [stepStatuses, setStepStatuses] = useState({});

  const loadData = async () => {
    const cust = await base44.entities.Customer.get(id);
    setCustomer(cust);
    const recs = await base44.entities.Recommendation.filter({ customer_id: id }, '-created_date', 1);
    if (recs.length > 0) setRecommendation(recs[0]);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [id]);

  const handleRunPipeline = async () => {
    setRunning(true);
    setStepStatuses({});
    setRecommendation(null);

    const { context } = await runPipeline(customer, (step, status) => {
      setStepStatuses(prev => ({ ...prev, [step]: status }));
    });

    const rec = await saveRecommendation(customer, context);
    setRecommendation(rec);
    setRunning(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!customer) {
    return <div className="p-8 text-center text-slate-500">Customer not found.</div>;
  }

  const c = customer;
  const daysToRenewal = c.renewal_date ? moment(c.renewal_date).diff(moment(), 'days') : null;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link to="/customers" className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors">
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{c.company_name}</h1>
              <HealthBadge score={c.health_score} />
              <RiskBadge level={c.churn_risk} />
            </div>
            <p className="text-sm text-slate-500 mt-0.5">{c.contact_name} · {c.contact_email} · {c.industry}</p>
          </div>
        </div>
        <button
          onClick={handleRunPipeline}
          disabled={running}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors disabled:opacity-60"
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {running ? 'Agents Running...' : 'Run Agent Analysis'}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatCard icon={DollarSign} label="MRR" value={`$${c.mrr?.toLocaleString()}`} />
        <StatCard icon={Activity} label="Engagement" value={`${c.engagement_score}/100`} />
        <StatCard icon={Clock} label="Last Login" value={`${c.days_since_login}d ago`} />
        <StatCard icon={Calendar} label="Renewal" value={daysToRenewal !== null ? `${daysToRenewal}d` : '—'} sub={c.renewal_date ? moment(c.renewal_date).format('MMM D') : ''} />
        <StatCard icon={Ticket} label="Open Tickets" value={c.open_tickets} />
        <StatCard icon={MessageSquare} label="Sentiment" value={c.sentiment} />
      </div>

      {/* Customer Details + Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Info Card */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-800">Customer Profile</h3>
          <InfoRow label="Plan" value={c.plan} />
          <InfoRow label="Lifetime Value" value={`$${c.lifetime_value?.toLocaleString()}`} />
          <InfoRow label="Usage Trend" value={c.usage_trend} />
          <InfoRow label="Usage Drop" value={`${c.usage_drop_percent}%`} />
          <InfoRow label="Journey Stage" value={c.journey_stage} />
          <InfoRow label="CSM" value={c.csm_assigned} />
          <InfoRow label="Contract Start" value={c.contract_start_date ? moment(c.contract_start_date).format('MMM D, YYYY') : '—'} />

          {(c.feature_requests || []).length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Feature Requests</p>
              <div className="flex flex-wrap gap-1">
                {c.feature_requests.map((f, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 text-xs font-medium">{f}</span>
                ))}
              </div>
            </div>
          )}

          {c.notes && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Notes</p>
              <p className="text-sm text-slate-600">{c.notes}</p>
            </div>
          )}
        </div>

        {/* Agent Timeline */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Agent Pipeline</h3>
          <AgentTimeline stepStatuses={stepStatuses} />
        </div>

        {/* Recommendation */}
        <div>
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Recommendation</h3>
          {recommendation ? (
            <RecommendationPanel recommendation={recommendation} onUpdate={loadData} />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
              <p className="text-sm text-slate-400">
                {running ? 'Agents are analyzing this customer...' : 'Run agent analysis to generate recommendations.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5 text-slate-400" />
        <p className="text-xs text-slate-500">{label}</p>
      </div>
      <p className="text-lg font-bold text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-700">{value}</span>
    </div>
  );
}