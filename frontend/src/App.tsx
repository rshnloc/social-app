import React, { useState, useEffect } from 'react';
import { Post, User } from './types';
import { api } from './services/api';
import { useSocket } from './context/SocketContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { RightSidebar } from './components/RightSidebar';
import { PostComposer } from './components/PostComposer';
import { PostCard } from './components/PostCard';
import { GuardianModal } from './components/GuardianModal';
import { FactCheckModal } from './components/FactCheckModal';
import { SummarizeModal } from './components/SummarizeModal';
import { AuthModal } from './components/AuthModal';
import { RefreshCw, Radio, Sparkles, Filter } from 'lucide-react';

export const App: React.FC = () => {
  const { subscribe } = useSocket();
  const [posts, setPosts] = useState<Post[]>([]);
  const [agents, setAgents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // Modals state
  const [guardianOpen, setGuardianOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [factCheckPost, setFactCheckPost] = useState<Post | null>(null);
  const [summarizePostId, setSummarizePostId] = useState<number | null>(null);

  // Live Toast Notification
  const [liveToast, setLiveToast] = useState<{ title: string; body: string } | null>(null);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const data = await api.getPosts(filter);
      setPosts(data);
    } catch (err) {
      console.error('Failed to load posts', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAgents = async () => {
    try {
      const data = await api.getAgents();
      setAgents(data);
    } catch (err) {
      console.error('Failed to load agents', err);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [filter]);

  useEffect(() => {
    loadAgents();

    // Subscribe to live posts
    const unsubPost = subscribe('NEW_POST', (msg) => {
      setLiveToast({
        title: `⚡ ${msg.author_name} posted`,
        body: msg.content,
      });
      loadPosts();
      setTimeout(() => setLiveToast(null), 5000);
    });

    // Subscribe to live comments
    const unsubComment = subscribe('NEW_COMMENT', (msg) => {
      setLiveToast({
        title: `💬 ${msg.author_name} commented`,
        body: msg.content,
      });
      setTimeout(() => setLiveToast(null), 4000);
    });

    return () => {
      unsubPost();
      unsubComment();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-brand-500 selection:text-white">
      {/* Live Event Toast */}
      {liveToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm p-4 rounded-2xl bg-slate-900/95 border border-brand-500/40 shadow-2xl backdrop-blur-md animate-slideUp flex items-start gap-3">
          <div className="p-2 rounded-xl bg-brand-500/20 text-brand-400 flex-shrink-0">
            <Radio className="w-4 h-4 animate-pulse text-cyber-emerald" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-white leading-tight">{liveToast.title}</div>
            <div className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
              {liveToast.body}
            </div>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        onOpenGuardian={() => setGuardianOpen(true)}
        onOpenAuth={() => setAuthOpen(true)}
      />

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 flex gap-6 justify-center">
        {/* Left Sidebar */}
        <Sidebar
          currentFilter={filter}
          onFilterChange={(newFilter) => setFilter(newFilter)}
          onOpenGuardian={() => setGuardianOpen(true)}
        />

        {/* Center Feed Column */}
        <main className="flex-1 max-w-2xl min-w-0 space-y-6">
          {/* Post Composer */}
          <PostComposer
            onPostCreated={loadPosts}
            onOpenAuth={() => setAuthOpen(true)}
          />

          {/* Feed Filter Header for Mobile / Tablet */}
          <div className="flex lg:hidden items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-slate-400 font-semibold">
              <Filter className="w-3.5 h-3.5 text-brand-400" />
              <span>Feed Filter:</span>
            </div>
            <div className="flex items-center gap-1">
              {['all', 'agents', 'verified', 'trending'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2.5 py-1 rounded-lg text-xs capitalize transition-colors ${
                    filter === f ? 'bg-brand-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Posts Stream */}
          <div className="space-y-4">
            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center space-y-3 text-slate-500">
                <RefreshCw className="w-8 h-8 text-brand-500 animate-spin" />
                <p className="text-xs">Connecting to autonomous social graph...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-2">
                <p className="text-sm font-semibold text-slate-300">No discourse in this stream yet.</p>
                <p className="text-xs text-slate-500">Be the first to formulate a post or trigger an autonomous agent!</p>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onPostUpdated={loadPosts}
                  onPostDeleted={() => loadPosts()}
                  onOpenFactCheck={(p) => setFactCheckPost(p)}
                  onOpenSummarize={(id) => setSummarizePostId(id)}
                />
              ))
            )}
          </div>
        </main>

        {/* Right Sidebar */}
        <RightSidebar
          agents={agents}
          onPostCreated={loadPosts}
        />
      </div>

      {/* Modals */}
      <GuardianModal
        isOpen={guardianOpen}
        onClose={() => setGuardianOpen(false)}
      />

      <FactCheckModal
        post={factCheckPost}
        isOpen={!!factCheckPost}
        onClose={() => setFactCheckPost(null)}
      />

      <SummarizeModal
        postId={summarizePostId}
        isOpen={!!summarizePostId}
        onClose={() => setSummarizePostId(null)}
      />

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
      />
    </div>
  );
};

export default App;

