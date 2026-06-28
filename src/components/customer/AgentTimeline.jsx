import React from 'react';
import { Brain, Search, BarChart3, Heart, Lightbulb, Zap, FileText, Database, CheckCircle2, Loader2, Clock, XCircle } from 'lucide-react';

const AGENT_META = {
  planner:        { icon: Brain, label: 'Planner Agent', color: 'violet' },
  retrieval:      { icon: Search, label: 'Retrieval Agent', color: 'blue' },
  analysis:       { icon: BarChart3, label: 'Analysis Agent', color: 'cyan' },
  sentiment:      { icon: Heart, label: 'Sentiment Agent', color: 'pink' },
  reasoning:      { icon: Lightbulb, label: 'Reasoning Agent', color: 'amber' },
  recommendation: { icon: Zap, label: 'Recommendation Agent', color: 'emerald' },
  explanation:    { icon: FileText, label: 'Explanation Agent', color: 'indigo' },
  memory:         { icon: Database, label: 'Memory Agent', color: 'slate' },
};

const STEP_ORDER = ['planner', 'retrieval', 'analysis', 'sentiment', 'reasoning', 'recommendation', 'explanation', 'memory'];

const STATUS_ICONS = {
  completed: CheckCircle2,
  running: Loader2,
  pending: Clock,
  failed: XCircle,
};

const BG_MAP = {
  violet: 'bg-violet-100', blue: 'bg-blue-100', cyan: 'bg-cyan-100',
  pink: 'bg-pink-100', amber: 'bg-amber-100', emerald: 'bg-emerald-100',
  indigo: 'bg-indigo-100', slate: 'bg-slate-200',
};
const TEXT_MAP = {
  violet: 'text-violet-600', blue: 'text-blue-600', cyan: 'text-cyan-600',
  pink: 'text-pink-600', amber: 'text-amber-600', emerald: 'text-emerald-600',
  indigo: 'text-indigo-600', slate: 'text-slate-600',
};

export default function AgentTimeline({ stepStatuses }) {
  return (
    <div className="space-y-0">
      {STEP_ORDER.map((step, idx) => {
        const meta = AGENT_META[step];
        const status = stepStatuses[step] || 'pending';
        const StatusIcon = STATUS_ICONS[status] || Clock;
        const isLast = idx === STEP_ORDER.length - 1;

        return (
          <div key={step} className="flex gap-3">
            {/* Vertical line + dot */}
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${BG_MAP[meta.color]}`}>
                <meta.icon className={`w-4 h-4 ${TEXT_MAP[meta.color]}`} />
              </div>
              {!isLast && <div className="w-px flex-1 bg-slate-200 my-1" />}
            </div>

            {/* Content */}
            <div className={`pb-4 flex-1 ${isLast ? '' : ''}`}>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-slate-800">{meta.label}</p>
                <StatusIcon className={`w-3.5 h-3.5 ${
                  status === 'completed' ? 'text-emerald-500' :
                  status === 'running' ? 'text-violet-500 animate-spin' :
                  status === 'failed' ? 'text-red-500' :
                  'text-slate-300'
                }`} />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {status === 'completed' ? 'Completed' :
                 status === 'running' ? 'Processing...' :
                 status === 'failed' ? 'Failed' :
                 'Waiting'}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}