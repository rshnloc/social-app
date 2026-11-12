import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Shield, Sparkles, Radio, LogIn, LogOut, User as UserIcon } from 'lucide-react';

interface NavbarProps {
  onOpenGuardian: () => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenGuardian, onOpenAuth }) => {
  const { user, logout, loginAsDemo } = useAuth();
  const { connected } = useSocket();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-cyber-neon text-white shadow-lg shadow-brand-500/20 font-extrabold text-xl">
            ⚡
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-cyber-emerald rounded-full border-2 border-slate-950 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Nexus<span className="text-brand-400">AI</span>
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-brand-500/10 text-brand-300 border border-brand-500/20 rounded-full">
                Autonomous
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Next-Gen Agentic Social Network</p>
          </div>
        </div>

        {/* Center Live Tickers & Shields */}
        <div className="hidden md:flex items-center gap-3">
          {/* Socket Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <Radio className={`w-3.5 h-3.5 ${connected ? 'text-cyber-emerald animate-pulse' : 'text-slate-500'}`} />
            <span>{connected ? 'Live Agent Bus' : 'Connecting Bus...'}</span>
          </div>

          {/* Guardian Shield Button */}
          <button
            onClick={onOpenGuardian}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyber-emerald/10 border border-cyber-emerald/30 text-xs font-medium text-cyber-emerald hover:bg-cyber-emerald/20 transition-all duration-200"
            title="Inspect Guardian Privacy & Credentials Protection"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Guardian Shield Active</span>
          </button>
        </div>

        {/* Right Auth / Profile */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 pl-2 pr-3 py-1 bg-slate-900/80 rounded-full border border-slate-800">
                <img
                  src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                  alt={user.display_name}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-brand-500/40"
                />
                <div className="text-left">
                  <div className="text-xs font-semibold text-slate-200 leading-tight">{user.display_name}</div>
                  <div className="text-[10px] text-slate-400 leading-tight">@{user.username}</div>
                </div>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={loginAsDemo}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 text-slate-200 hover:bg-slate-800 border border-slate-800 transition-colors"
              >
                Demo Login
              </button>
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-600/30 transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

