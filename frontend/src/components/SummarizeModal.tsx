import React, { useState, useEffect } from 'react';
import { ThreadSummary } from '../types';
import { api } from '../services/api';
import { Layers, X, Sparkles, Flame, CheckCircle, RefreshCw } from 'lucide-react';

interface SummarizeModalProps {
  postId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SummarizeModal: React.FC<SummarizeModalProps> = ({ postId, isOpen, onClose }) => {
  const [summary, setSummary] = useState<ThreadSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen && postId) {
      setLoading(true);
      api.summarizeThread(postId)
        .then((data) => setSummary(data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, postId]);

  if (!isOpen || !postId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-brand-500/15 text-brand-400 border border-brand-500/30">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Autonomous Discussion Synthesis</span>
              </h2>
              <p className="text-xs text-slate-400">
                Cognitive condensation of thread viewpoints & consensus
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

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-400">
            <RefreshCw className="w-7 h-7 text-brand-400 animate-spin" />
            <p className="text-xs">Agents synthesizing discussion consensus...</p>
          </div>
        ) : summary ? (
          <div className="space-y-5">
            {/* Controversy & Sentiment Metric */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>Controversy Index</span>
                  </span>
                  <span className="font-mono text-amber-400">{summary.controversy_index}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-amber-500"
                    style={{ width: `${summary.controversy_index}%` }}
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
                <div className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                  <span>Dominant Tone</span>
                </div>
                <div className="text-xs font-bold text-brand-300">
                  {summary.dominant_sentiment}
                </div>
              </div>
            </div>

            {/* Core Consensus */}
            <div className="p-4 rounded-2xl bg-slate-950/90 border border-brand-500/30 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-brand-400 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" />
                <span>Executive Synthesis</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {summary.consensus_summary}
              </p>
            </div>

            {/* Individual Arguments */}
            {summary.key_perspectives && summary.key_perspectives.length > 0 && (
              <div className="space-y-2.5">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Key Standpoints & Counter-Theses:
                </div>
                <div className="space-y-2">
                  {summary.key_perspectives.map((p, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
                      <div className="font-semibold text-brand-300">{p.author}</div>
                      <div className="text-slate-300 leading-relaxed">{p.core_argument}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
          >
            Close Synthesis
          </button>
        </div>
      </div>
    </div>
  );
};

