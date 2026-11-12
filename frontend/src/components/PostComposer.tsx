import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { GuardianClient } from '../services/guardianClient';
import { GuardianReport } from '../types';
import {
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  Send,
  Wand2,
  Lock,
  Tag,
  AlertTriangle,
  AtSign,
  Check,
} from 'lucide-react';

interface PostComposerProps {
  onPostCreated: () => void;
  onOpenAuth: () => void;
}

export const PostComposer: React.FC<PostComposerProps> = ({ onPostCreated, onOpenAuth }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [tone, setTone] = useState('intellectual');
  const [enhancing, setEnhancing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [autoRedact, setAutoRedact] = useState(true);
  const [guardianReport, setGuardianReport] = useState<GuardianReport | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  // Real-time zero-latency client preflight scan on keystroke
  useEffect(() => {
    if (content.trim()) {
      const report = GuardianClient.scanLocal(content);
      setGuardianReport(report);
    } else {
      setGuardianReport(null);
    }
  }, [content]);

  const handleEnhance = async () => {
    if (!content.trim()) return;
    try {
      setEnhancing(true);
      const res = await api.enhancePost(content, tone);
      setContent(res.enhanced_content);
    } catch (err: any) {
      console.error('Enhancement error:', err);
    } finally {
      setEnhancing(false);
    }
  };

  const handleApplyRedaction = () => {
    if (guardianReport && guardianReport.redacted_preview) {
      setContent(guardianReport.redacted_preview);
    }
  };

  const insertMention = (handle: string) => {
    setContent((prev) => (prev ? `${prev} @${handle} ` : `@${handle} `));
  };

  const handlePublish = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    if (!content.trim()) return;

    try {
      setPublishing(true);
      setPublishError(null);
      await api.createPost({
        content,
        auto_redact_pii: autoRedact,
      });
      setContent('');
      setGuardianReport(null);
      setCopilotOpen(false);
      onPostCreated();
    } catch (err: any) {
      setPublishError(err.message || 'Failed to publish post');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 shadow-xl overflow-hidden backdrop-blur-md transition-all">
      <div className="p-4 sm:p-5 space-y-3">
        {/* Author row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={user?.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=guest'}
              alt={user?.display_name || 'Guest'}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-brand-500/30"
            />
            <div>
              <div className="text-sm font-bold text-slate-100">
                {user ? user.display_name : 'Guest Thinker'}
              </div>
              <div className="text-xs text-slate-400">
                {user ? `@${user.username}` : 'Sign in to publish or reply'}
              </div>
            </div>
          </div>

          {/* Guardian Shield Status Pill */}
          <div className="flex items-center gap-2">
            {guardianReport && !guardianReport.is_safe ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-semibold animate-pulse">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Guardian: {guardianReport.findings_count} Sensitive Item(s) Detected</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyber-emerald/10 border border-cyber-emerald/30 text-cyber-emerald text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Zero Leaks Guarded</span>
              </div>
            )}
          </div>
        </div>

        {/* Text Area */}
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share an insight, hypothesis, or mention @ElenaVance or @CipherX to invoke autonomous agents..."
            rows={3}
            className="w-full bg-slate-950/70 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-500 resize-none outline-none transition-all"
          />
        </div>

        {/* Guardian Warning Card (when credentials/PII found) */}
        {guardianReport && !guardianReport.is_safe && (
          <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-800/50 space-y-2.5 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-300 text-xs font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Guardian Shield Preflight Warning: Sensitive Data Detected</span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
                Risk Score: {guardianReport.risk_score}/100
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-rose-200/90">
              {guardianReport.findings.map((f, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-rose-900/40">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-rose-400">{f.description}:</span>
                    <span className="font-mono text-slate-300 text-[11px]">{f.snippet}</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">
                    {f.severity}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoRedactCheck"
                  checked={autoRedact}
                  onChange={(e) => setAutoRedact(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-brand-500 focus:ring-brand-500"
                />
                <label htmlFor="autoRedactCheck" className="text-xs text-slate-300 select-none cursor-pointer">
                  Auto-redact sensitive values on publish
                </label>
              </div>

              <button
                type="button"
                onClick={handleApplyRedaction}
                className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold border border-rose-500/30 transition-colors"
              >
                Apply Redactions Now
              </button>
            </div>
          </div>
        )}

        {/* Quick Agent Mention Bar */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mr-1">
            <AtSign className="w-3 h-3 text-brand-400" /> Mention Agent:
          </span>
          {['ElenaVance', 'CipherX', 'SoraNova', 'NovaFact', 'GuardianAI'].map((handle) => (
            <button
              key={handle}
              type="button"
              onClick={() => insertMention(handle)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-brand-300 border border-slate-700/70 font-mono transition-colors"
            >
              @{handle}
            </button>
          ))}
        </div>

        {/* AI Copilot Drawer */}
        {copilotOpen && (
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-brand-500/30 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between text-xs text-brand-300 font-semibold">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                <span>AI Social Copilot Studio</span>
              </div>
              <span className="text-[11px] text-slate-400">Transform voice & extract high-signal tags</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'intellectual', label: '🧠 Intellectual' },
                { id: 'provocative', label: '🔥 Provocative' },
                { id: 'concise', label: '⚡ Concise TL;DR' },
                { id: 'futurist', label: '🚀 Futurist' },
                { id: 'socratic', label: '❓ Socratic' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTone(t.id)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                    tone === t.id
                      ? 'bg-brand-600/30 text-brand-200 border-brand-500 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}

              <button
                type="button"
                onClick={handleEnhance}
                disabled={enhancing || !content.trim()}
                className="ml-auto px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-brand-600/20 transition-all"
              >
                <Wand2 className={`w-3.5 h-3.5 ${enhancing ? 'animate-spin' : ''}`} />
                <span>{enhancing ? 'Enhancing...' : 'Enhance Draft'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Error message */}
        {publishError && (
          <div className="p-2.5 rounded-xl bg-rose-950/50 border border-rose-800 text-xs text-rose-300">
            {publishError}
          </div>
        )}

        {/* Action bar */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setCopilotOpen(!copilotOpen)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              copilotOpen
                ? 'bg-brand-600/20 text-brand-300 border-brand-500/40'
                : 'bg-slate-800/60 text-slate-300 border-slate-700/60 hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>AI Copilot</span>
          </button>

          <button
            type="button"
            onClick={handlePublish}
            disabled={publishing || !content.trim()}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-brand-600/30 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{publishing ? 'Publishing...' : 'Publish Post'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

