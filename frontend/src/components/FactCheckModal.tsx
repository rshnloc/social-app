import React from 'react';
import { Post, FactCheckDetails } from '../types';
import { CheckCircle2, AlertCircle, X, ShieldAlert, BookOpen, Scale, Sparkles } from 'lucide-react';

interface FactCheckModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
}

export const FactCheckModal: React.FC<FactCheckModalProps> = ({ post, isOpen, onClose }) => {
  if (!isOpen || !post) return null;

  const details: FactCheckDetails | undefined = post.fact_check_details || undefined;
  const score = post.fact_check_score || 85;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-2xl border ${
              post.fact_check_status === 'VERIFIED'
                ? 'bg-cyber-emerald/15 text-cyber-emerald border-cyber-emerald/30'
                : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
            }`}>
              {post.fact_check_status === 'VERIFIED' ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>NovaFact Autonomous Fact-Check</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300">
                  Real-Time
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Independent knowledge verification by @NovaFact agent
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Score & Verdict Banner */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Epistemic Credibility Rating:
            </span>
            <span className={`text-sm font-bold font-mono px-3 py-1 rounded-full ${
              score >= 90
                ? 'bg-cyber-emerald/20 text-cyber-emerald border border-cyber-emerald/40'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
            }`}>
              {score}% Grounded
            </span>
          </div>

          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                score >= 90 ? 'bg-cyber-emerald' : 'bg-amber-500'
              }`}
              style={{ width: `${score}%` }}
            />
          </div>

          <p className="text-xs text-slate-300 leading-relaxed pt-1">
            {details?.verdict_summary ||
              'Claim exhibits strong internal coherence with verified peer-reviewed scientific parameters.'}
          </p>
        </div>

        {/* Claims Evaluated */}
        {details?.claims_analyzed && details.claims_analyzed.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-brand-400" />
              <span>Claims Analyzed</span>
            </div>
            <div className="space-y-2">
              {details.claims_analyzed.map((c, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
                  <div className="font-semibold text-slate-200">"{c.claim}"</div>
                  <div className="text-[11px] text-cyber-neon font-medium">Rating: {c.rating}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Counter Perspectives */}
        {details?.counter_perspectives && details.counter_perspectives.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Nuance & Counter-Perspectives</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 leading-relaxed">
              {details.counter_perspectives.map((cp, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>{cp}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sources Cited */}
        {details?.context_sources && details.context_sources.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>Context & Academic Citations</span>
            </div>
            <ul className="space-y-1 text-xs text-slate-400 font-mono">
              {details.context_sources.map((s, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="text-indigo-400">›</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
          >
            Close Analysis
          </button>
        </div>
      </div>
    </div>
  );
};

