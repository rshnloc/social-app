import React, { useState } from 'react';
import { GuardianClient } from '../services/guardianClient';
import { GuardianReport } from '../types';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  EyeOff,
  FileText,
  Key,
  X,
  CheckCircle,
  Copy,
} from 'lucide-react';

interface GuardianModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuardianModal: React.FC<GuardianModalProps> = ({ isOpen, onClose }) => {
  const [testText, setTestText] = useState(
    'sk-proj-9876543210abcdef0123456789 and call me at 415-555-8921. SSN: 000-12-3456. Strictly Confidential Client IP.'
  );
  const [report, setReport] = useState<GuardianReport>(() => GuardianClient.scanLocal(testText));
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleTextChange = (val: string) => {
    setTestText(val);
    setReport(GuardianClient.scanLocal(val));
  };

  const handleCopyRedacted = () => {
    navigator.clipboard.writeText(report.redacted_preview);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-cyber-emerald/15 text-cyber-emerald border border-cyber-emerald/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Guardian Shield Security Center</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyber-emerald/20 text-cyber-emerald">
                  Active
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Autonomous defense against credential, PII, and confidential corporate leaks
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

        {/* Protection categories summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-rose-400 text-xs font-bold">
              <Key className="w-4 h-4" />
              <span>Credentials</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Live & expired API keys (OpenAI, AWS, GitHub), JWTs, RSA private keys, DB connection strings.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
              <EyeOff className="w-4 h-4" />
              <span>Personal Data (PII)</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Credit cards (Luhn-checked), Social Security Numbers, personal phones, government identifiers.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold">
              <Lock className="w-4 h-4" />
              <span>Confidential IP</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Non-disclosure markers, client proprietary material, unreleased financial statements.
            </p>
          </div>
        </div>

        {/* Interactive Scanner Workbench */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Live Interactive Sandbox Scanner:
            </label>
            <span
              className={`text-xs font-mono px-2.5 py-0.5 rounded-full font-bold ${
                report.is_safe
                  ? 'bg-cyber-emerald/20 text-cyber-emerald border border-cyber-emerald/40'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
              }`}
            >
              Risk Index: {report.risk_score} / 100 ({report.is_safe ? 'Safe' : 'Critical Threat'})
            </span>
          </div>

          <textarea
            value={testText}
            onChange={(e) => handleTextChange(e.target.value)}
            rows={3}
            className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl p-3 text-xs text-slate-200 font-mono outline-none"
            placeholder="Type or paste any sensitive string or keys to test Guardian..."
          />
        </div>

        {/* Detected Findings */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-300">
            Detected Vulnerabilities ({report.findings_count}):
          </div>
          {report.findings.length === 0 ? (
            <div className="p-3 rounded-xl bg-cyber-emerald/10 border border-cyber-emerald/30 text-xs text-cyber-emerald flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>No credentials, personal data, or confidential markers detected in payload.</span>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {report.findings.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-200 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <span>{f.description}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono pl-4">{f.recommendation}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-[10px] font-bold">
                    {f.severity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Redacted Preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>Automated Redacted Output Preview:</span>
            <button
              onClick={handleCopyRedacted}
              className="flex items-center gap-1 text-[11px] text-brand-400 hover:text-brand-300 font-normal"
            >
              <Copy className="w-3 h-3" />
              <span>{copied ? 'Copied!' : 'Copy Redacted'}</span>
            </button>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap">
            {report.redacted_preview || '(Empty)'}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
          >
            Close Center
          </button>
        </div>
      </div>
    </div>
  );
};

