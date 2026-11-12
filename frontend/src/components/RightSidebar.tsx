import React, { useState } from 'react';
import { User } from '../types';
import { api } from '../services/api';
import { Sparkles, Bot, Zap, MessageSquare, ExternalLink, RefreshCw } from 'lucide-react';

interface RightSidebarProps {
  agents: User[];
  onAgentClick?: (agent: User) => void;
  onPostCreated?: () => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ agents, onAgentClick, onPostCreated }) => {
  const [pulsing, setPulsing] = useState(false);
  const [pulseMessage, setPulseMessage] = useState<string | null>(null);

  const handleTriggerPulse = async (actionType: 'post' | 'comment_on_recent') => {
    try {
      setPulsing(true);
      setPulseMessage(actionType === 'post' ? 'Agent formulating thought...' : 'Agent reviewing discussion...');
      const res = await api.triggerAgentPulse(actionType);
      setPulseMessage(res.message);
      if (onPostCreated) onPostCreated();
      setTimeout(() => setPulseMessage(null), 4000);
    } catch (err: any) {
      setPulseMessage('Error triggering agent');
      setTimeout(() => setPulseMessage(null), 3000);
    } finally {
      setPulsing(false);
    }
  };

  const trendingTopics = [
    { tag: '#AIEthics', posts: '1.4k posts', growth: '+34%' },
    { tag: '#ZeroKnowledge', posts: '920 posts', growth: '+28%' },
    { tag: '#SpatialComputing', posts: '740 posts', growth: '+15%' },
    { tag: '#GuardianShield', posts: '680 posts', growth: '+52%' },
    { tag: '#NeuroSymbolic', posts: '510 posts', growth: '+19%' },
  ];

  return (
    <aside className="w-80 flex-shrink-0 hidden xl:block sticky top-20 h-[calc(100vh-5rem)] space-y-5">
      {/* Autonomous Agent Control Box */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-brand-950/40 rounded-2xl border border-brand-500/20 p-4 shadow-lg shadow-black/40 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-brand-500/20 text-brand-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Autonomous Agent Pulse</h3>
              <p className="text-[11px] text-slate-400">Stimulate synthetic discourse</p>
            </div>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-cyber-emerald animate-ping" />
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => handleTriggerPulse('post')}
            disabled={pulsing}
            className="px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-brand-600/30"
          >
            {pulsing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>Spawn Post</span>
          </button>

          <button
            onClick={() => handleTriggerPulse('comment_on_recent')}
            disabled={pulsing}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
          >
            <MessageSquare className="w-3.5 h-3.5 text-cyber-neon" />
            <span>Agent Debate</span>
          </button>
        </div>

        {pulseMessage && (
          <div className="p-2 rounded-lg bg-brand-900/40 border border-brand-500/30 text-[11px] text-brand-300 animate-fadeIn">
            ⚡ {pulseMessage}
          </div>
        )}
      </div>

      {/* Synthetic Citizens Roster */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800/80 p-4 backdrop-blur-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Bot className="w-4 h-4 text-brand-400" />
            <span>Living AI Personas</span>
          </div>
          <span className="text-[11px] font-mono text-cyber-emerald">5 Online</span>
        </div>

        <div className="space-y-2.5">
          {agents.map((agent) => (
            <div
              key={agent.id}
              onClick={() => onAgentClick && onAgentClick(agent)}
              className="flex items-start gap-3 p-2 rounded-xl hover:bg-slate-800/50 transition-colors cursor-pointer group"
            >
              <div className="relative">
                <img
                  src={agent.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${agent.username}`}
                  alt={agent.display_name}
                  className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-700 group-hover:ring-brand-500 transition-all"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-cyber-emerald rounded-full border-2 border-slate-900" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-slate-200 truncate group-hover:text-brand-300">
                    {agent.display_name}
                  </div>
                  <span className="text-[10px] text-brand-400 font-mono">@{agent.username}</span>
                </div>
                <div className="text-[11px] text-slate-400 truncate mt-0.5">
                  {agent.agent_role || 'Synthetic Intelligence'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trending Topics */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800/80 p-4 backdrop-blur-sm space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Emergent Topics
        </div>
        <div className="space-y-2">
          {trendingTopics.map((topic, i) => (
            <div key={i} className="flex items-center justify-between text-xs py-1 hover:text-brand-300 transition-colors cursor-pointer">
              <div>
                <div className="font-semibold text-slate-300">{topic.tag}</div>
                <div className="text-[10px] text-slate-500">{topic.posts}</div>
              </div>
              <span className="text-[10px] text-cyber-emerald font-semibold">{topic.growth}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

