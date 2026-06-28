import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Brain, Search, BarChart3, Heart, Lightbulb, Zap, FileText, Database, CheckCircle2, XCircle, ArrowDown } from 'lucide-react';
import moment from 'moment';

const AGENT_META = {
  Planner:        { icon: Brain, color: 'from-violet-500 to-indigo-600', bg: 'bg-violet-50', text: 'text-violet-700' },
  Retrieval:      { icon: Search, color: 'from-blue-500 to-cyan-600', bg: 'bg-blue-50', text: 'text-blue-700' },
  Analysis:       { icon: BarChart3, color: 'from-cyan-500 to-teal-600', bg: 'bg-cyan-50', text: 'text-cyan-700' },
  Sentiment:      { icon: Heart, color: 'from-pink-500 to-rose-600', bg: 'bg-pink-50', text: 'text-pink-700' },
  Reasoning:      { icon: Lightbulb, color: 'from-amber-500 to-orange-600', bg: 'bg-amber-50', text: 'text-amber-700' },
  Recommendation: { icon: Zap, color: 'from-emerald-500 to-green-600', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  Explanation:    { icon: FileText, color: 'from-indigo-500 to-purple-600', bg: 'bg-indigo-50', text: 'text-indigo-700' },
  Memory:         { icon: Database, color: 'from-slate-500 to-gray-600', bg: 'bg-slate-100', text: 'text-slate-700' },
};

export default function Pipeline() {
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    async function load() {
      const data = await base44.entities.AgentExecution.list('-created_date', 100);
      setExecutions(data);
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

  // Group by session
  const sessions = {};
  executions.forEach(e => {
    const key = e.session_id || e.id;
    if (!sessions[key]) sessions[key] = [];
    sessions[key].push(e);
  });
  const sessionList = Object.entries(sessions).sort((a, b) => {
    const aDate = a[1][0]?.created_date || '';
    const bDate = b[1][0]?.created_date || '';
    return bDate.localeCompare(aDate);
  });

  const activeSession = selectedSession ? sessions[selectedSession] : sessionList[0]?.[1];
  const activeSteps = (activeSession || []).sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Agent Pipeline</h1>
        <p className="text-sm text-slate-500 mt-0.5">Multi-agent execution timeline & orchestration logs</p>
      </div>

      {sessionList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <Brain className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No pipeline executions yet. Run an agent analysis from a customer detail page.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Session List */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Sessions</p>
            {sessionList.map(([sid, steps]) => {
              const first = steps[0];
              const isActive = (selectedSession || sessionList[0]?.[0]) === sid;
              return (
                <button
                  key={sid}
                  onClick={() => setSelectedSession(sid)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-colors ${
                    isActive ? 'bg-violet-50 border border-violet-200' : 'bg-white border border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  <p className="text-sm font-medium text-slate-800 truncate">{first?.customer_id ? `Customer Analysis` : 'Session'}</p>
                  <p className="text-xs text-slate-400">{steps.length} agents · {moment(first?.created_date).fromNow()}</p>
                </button>
              );
            })}
          </div>

          {/* Timeline */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 p-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-6">Execution Timeline</h3>
            <div className="space-y-0">
              {activeSteps.map((step, idx) => {
                const meta = AGENT_META[step.agent_type] || AGENT_META.Planner;
                const Icon = meta.icon;
                const isLast = idx === activeSteps.length - 1;
                const output = step.output_data || {};

                return (
                  <div key={step.id}>
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${meta.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        {!isLast && <div className="w-px flex-1 bg-slate-200 my-1" />}
                      </div>
                      <div className={`flex-1 ${isLast ? '' : 'pb-5'}`}>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-slate-800">{step.agent_name}</h4>
                          {step.status === 'Completed' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : step.status === 'Failed' ? (
                            <XCircle className="w-4 h-4 text-red-500" />
                          ) : null}
                          {step.duration_ms && (
                            <span className="text-xs text-slate-400">{(step.duration_ms / 1000).toFixed(1)}s</span>
                          )}
                        </div>

                        {/* Output Preview */}
                        {Object.keys(output).length > 0 && !output.error && (
                          <div className={`mt-2 p-3 rounded-xl ${meta.bg} text-xs ${meta.text}`}>
                            {renderOutput(output, step.agent_type)}
                          </div>
                        )}
                        {output.error && (
                          <div className="mt-2 p-3 rounded-xl bg-red-50 text-xs text-red-700">
                            Error: {output.error}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {activeSteps.length > 0 && (
              <div className="mt-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50">
                <ArrowDown className="w-4 h-4 text-slate-400" />
                <p className="text-xs text-slate-500">Pipeline complete → Human Approval Required</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function renderOutput(output, type) {
  switch (type) {
    case 'Planner':
      return (
        <div className="space-y-1">
          <p><strong>Assessment:</strong> {output.assessment}</p>
          <p><strong>Urgency:</strong> {output.urgency_level}</p>
          {output.agents_to_run && <p><strong>Agents:</strong> {output.agents_to_run.join(' → ')}</p>}
        </div>
      );
    case 'Analysis':
      return (
        <div className="space-y-1">
          <p><strong>Churn Probability:</strong> {output.churn_probability}%</p>
          <p><strong>Upsell Opportunity:</strong> {output.upsell_opportunity}%</p>
          {output.risk_factors && <p><strong>Risks:</strong> {output.risk_factors.slice(0, 2).join(', ')}</p>}
        </div>
      );
    case 'Sentiment':
      return (
        <div className="space-y-1">
          <p><strong>Sentiment:</strong> {output.overall_sentiment} ({output.sentiment_score}/100)</p>
          <p><strong>Urgency:</strong> {output.urgency_level} · Frustration: {output.frustration_level}</p>
        </div>
      );
    case 'Recommendation':
      return (
        <div className="space-y-1">
          {output.top_recommendation && (
            <p><strong>Top Action:</strong> {output.top_recommendation.title} ({output.top_recommendation.confidence_score}% confidence)</p>
          )}
          {output.alternatives && <p><strong>Alternatives:</strong> {output.alternatives.map(a => a.title).join(', ')}</p>}
        </div>
      );
    default:
      // Show first 3 key-value pairs
      return (
        <div className="space-y-1">
          {Object.entries(output).slice(0, 3).map(([k, v]) => (
            <p key={k}><strong>{k.replace(/_/g, ' ')}:</strong> {Array.isArray(v) ? v.join(', ') : String(v).slice(0, 120)}</p>
          ))}
        </div>
      );
  }
}