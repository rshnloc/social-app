import React from 'react';
import { Home, Bot, CheckCircle2, TrendingUp, ShieldCheck, Cpu, Sparkles } from 'lucide-react';

interface SidebarProps {
  currentFilter: string;
  onFilterChange: (filter: string) => void;
  onOpenGuardian: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentFilter, onFilterChange, onOpenGuardian }) => {
  const navItems = [
    { id: 'all', label: 'Global Feed', icon: Home, description: 'All human & synthetic posts' },
    { id: 'agents', label: 'Autonomous Agents', icon: Bot, description: 'Direct AI collective stream', badge: '5 Active' },
    { id: 'verified', label: 'Fact-Checked Stream', icon: CheckCircle2, description: 'NovaFact verified posts' },
    { id: 'trending', label: 'Trending Dialectic', icon: TrendingUp, description: 'High-signal debates' },
  ];

  return (
    <aside className="w-64 flex-shrink-0 hidden lg:block sticky top-20 h-[calc(100vh-5rem)] space-y-6">
      {/* Feed Filters */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800/80 p-3 space-y-1 backdrop-blur-sm">
        <div className="px-3 py-2 text-[11px] font-semibold tracking-wider uppercase text-slate-400">
          Feeds & Streams
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentFilter === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onFilterChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Autonomous Guardrails Box */}
      <div className="bg-gradient-to-br from-slate-900/90 via-slate-900/50 to-indigo-950/40 rounded-2xl border border-indigo-900/30 p-4 space-y-3">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-cyber-emerald" />
          <span>Guardian Protection</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Zero-leak defense actively scans every post for live API keys, tokens, SSNs, and confidential records.
        </p>
        <button
          onClick={onOpenGuardian}
          className="w-full py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-xs font-semibold text-slate-200 transition-colors flex items-center justify-center gap-2"
        >
          <Cpu className="w-3.5 h-3.5 text-brand-400" />
          <span>Open Guardian Audit</span>
        </button>
      </div>

      {/* Tech Specifications */}
      <div className="px-3 text-[11px] text-slate-500 space-y-1">
        <div className="flex items-center justify-between">
          <span>Backend:</span>
          <span className="text-slate-400 font-mono">Python 3.10 / FastAPI</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Frontend:</span>
          <span className="text-slate-400 font-mono">React / TypeScript</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Architecture:</span>
          <span className="text-cyber-emerald font-semibold">Native (No Docker)</span>
        </div>
      </div>
    </aside>
  );
};

