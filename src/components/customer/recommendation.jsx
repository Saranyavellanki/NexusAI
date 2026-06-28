import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Check, X, Pencil, Zap, Star } from 'lucide-react';
import ConfidenceBar from '@/components/shared/ConfidenceBar';
import { useToast } from '@/components/ui/use-toast';

export default function RecommendationPanel({ recommendation, onUpdate }) {
  const [feedback, setFeedback] = useState('');
  const [modifiedAction, setModifiedAction] = useState('');
  const [showModify, setShowModify] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  if (!recommendation) return null;

  const handleDecision = async (status) => {
    setSaving(true);
    const updateData = { status };
    if (status === 'Rejected' && feedback) updateData.human_feedback = feedback;
    if (status === 'Modified' && modifiedAction) {
      updateData.human_feedback = feedback;
      updateData.modified_action = modifiedAction;
    }

    await base44.entities.Recommendation.update(recommendation.id, updateData);

    // Store decision in memory
    await base44.entities.MemoryRecord.create({
      customer_id: recommendation.customer_id,
      customer_name: recommendation.customer_name,
      record_type: 'Decision',
      title: `${status}: ${recommendation.title}`,
      content: feedback || modifiedAction || `${status} by CSM`,
      recommendation_id: recommendation.id,
      decision: status === 'Approved' ? 'Approved' : status === 'Rejected' ? 'Rejected' : 'Modified',
      tags: [status.toLowerCase(), recommendation.category?.toLowerCase() || 'general'],
    });

    setSaving(false);
    toast({ title: `Recommendation ${status.toLowerCase()}`, description: `Action has been ${status.toLowerCase()} successfully.` });
    onUpdate?.();
  };

  const alternatives = recommendation.alternative_actions || [];
  const evidence = recommendation.supporting_evidence || [];

  return (
    <div className="space-y-4">
      {/* Top Recommendation */}
      <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl border border-violet-200/50 p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-violet-600 uppercase tracking-wider mb-0.5">Top Recommendation</p>
            <h3 className="text-base font-bold text-slate-900">{recommendation.title}</h3>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
            recommendation.priority === 'Critical' ? 'bg-red-100 text-red-700' :
            recommendation.priority === 'High' ? 'bg-orange-100 text-orange-700' :
            recommendation.priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
            'bg-slate-100 text-slate-600'
          }`}>{recommendation.priority}</span>
        </div>
        <p className="text-sm text-slate-600 mb-4">{recommendation.description}</p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <p className="text-xs text-slate-500 mb-1">Confidence</p>
            <ConfidenceBar score={recommendation.confidence_score} />
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Impact Score</p>
            <ConfidenceBar score={recommendation.impact_score} />
          </div>
        </div>

        {recommendation.expected_impact && (
          <div className="bg-white/60 rounded-xl p-3 mb-4">
            <p className="text-xs font-medium text-slate-500 mb-1">Expected Impact</p>
            <p className="text-sm text-slate-700">{recommendation.expected_impact}</p>
          </div>
        )}

        {/* Explanation */}
        {recommendation.explanation && (
          <div className="bg-white/60 rounded-xl p-3 mb-4">
            <p className="text-xs font-medium text-slate-500 mb-1">AI Explanation</p>
            <p className="text-sm text-slate-700">{recommendation.explanation}</p>
          </div>
        )}

        {/* Evidence */}
        {evidence.length > 0 && (
          <div className="bg-white/60 rounded-xl p-3 mb-4">
            <p className="text-xs font-medium text-slate-500 mb-2">Supporting Evidence</p>
            <ul className="space-y-1">
              {evidence.map((e, i) => (
                <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                  <span className="text-violet-500 mt-0.5">•</span>
                  {e}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Approval Actions */}
        {recommendation.status === 'Pending' && (
          <div className="space-y-3">
            <textarea
              placeholder="Add feedback or notes (optional)..."
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-violet-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 bg-white/80 resize-none"
              rows={2}
            />

            {showModify && (
              <textarea
                placeholder="Describe the modified action..."
                value={modifiedAction}
                onChange={e => setModifiedAction(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-amber-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 bg-white/80 resize-none"
                rows={2}
              />
            )}

            <div className="flex gap-2">
              <button
                onClick={() => handleDecision('Approved')}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                <Check className="w-4 h-4" /> Approve
              </button>
              <button
                onClick={() => handleDecision('Rejected')}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" /> Reject
              </button>
              <button
                onClick={() => {
                  if (showModify && modifiedAction) handleDecision('Modified');
                  else setShowModify(true);
                }}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
              >
                <Pencil className="w-4 h-4" /> Modify
              </button>
            </div>
          </div>
        )}

        {recommendation.status !== 'Pending' && (
          <div className={`rounded-xl px-4 py-3 text-sm font-medium ${
            recommendation.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
            recommendation.status === 'Rejected' ? 'bg-red-100 text-red-800' :
            'bg-amber-100 text-amber-800'
          }`}>
            Status: {recommendation.status}
            {recommendation.human_feedback && <p className="text-xs mt-1 opacity-75">Feedback: {recommendation.human_feedback}</p>}
          </div>
        )}
      </div>

      {/* Alternatives */}
      {alternatives.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Alternative Actions</p>
          <div className="space-y-2">
            {alternatives.map((alt, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-50">
                <div className="flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-sm font-medium text-slate-700">{alt.title}</span>
                </div>
                <span className="text-xs text-slate-500">{alt.confidence}% confidence</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}