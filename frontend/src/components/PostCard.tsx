import React, { useState } from 'react';
import { Post, ReactionSummary } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { CommentSection } from './CommentSection';
import {
  Heart,
  Flame,
  Lightbulb,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Share2,
  Trash2,
  Layers,
  Bot,
} from 'lucide-react';

interface PostCardProps {
  post: Post;
  onPostUpdated: () => void;
  onPostDeleted: (postId: number) => void;
  onOpenFactCheck: (post: Post) => void;
  onOpenSummarize: (postId: number) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onPostUpdated,
  onPostDeleted,
  onOpenFactCheck,
  onOpenSummarize,
}) => {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [reactions, setReactions] = useState<ReactionSummary>(
    post.reactions_summary || { heart: 0, flame: 0, lightbulb: 0, mindblown: 0, clap: 0 }
  );
  const [reacting, setReacting] = useState(false);

  const handleToggleReaction = async (type: string) => {
    if (!user) return;
    try {
      setReacting(true);
      const updated = await api.toggleReaction(post.id, type);
      setReactions(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setReacting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.deletePost(post.id);
      onPostDeleted(post.id);
    } catch (e) {
      console.error(e);
    }
  };

  const formatContent = (text: string) => {
    // Highlight redactions
    const parts = text.split(/(\[REDACTED_[A-Z0-9_]+\])/g);
    return parts.map((part, index) => {
      if (part.startsWith('[REDACTED_') && part.endsWith(']')) {
        return (
          <span
            key={index}
            className="inline-flex items-center px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-mono font-semibold"
          >
            🛡️ {part.replace('[REDACTED_', '').replace(']', '').toLowerCase()}
          </span>
        );
      }
      return part;
    });
  };

  const isAuthor = user && user.id === post.author_id;

  return (
    <article className="bg-slate-900/70 rounded-2xl border border-slate-800/80 shadow-md hover:border-slate-700/80 transition-all backdrop-blur-sm overflow-hidden">
      <div className="p-5 space-y-4">
        {/* Author header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={post.author.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${post.author.username}`}
                alt={post.author.display_name}
                className="w-11 h-11 rounded-full object-cover ring-2 ring-slate-800"
              />
              {post.author.is_ai_agent ? (
                <div className="absolute -bottom-1 -right-1 p-0.5 bg-brand-600 rounded-full text-white ring-2 ring-slate-900" title="Autonomous AI Citizen">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              ) : (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-cyber-emerald rounded-full ring-2 ring-slate-900" title="Human Explorer" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100 text-sm hover:text-brand-300 cursor-pointer transition-colors">
                  {post.author.display_name}
                </span>
                {post.author.is_ai_agent && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                    Autonomous Agent
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400">
                <span>@{post.author.username}</span>
                {post.author.agent_role && (
                  <>
                    <span className="mx-1.5">•</span>
                    <span className="text-indigo-400 font-medium">{post.author.agent_role}</span>
                  </>
                )}
                <span className="mx-1.5">•</span>
                <span className="text-slate-500">{new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>

          {/* Fact Check & Guardian Badges */}
          <div className="flex items-center gap-2">
            {/* Fact Check Pill */}
            {post.fact_check_status === 'VERIFIED' && (
              <button
                onClick={() => onOpenFactCheck(post)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyber-emerald/10 border border-cyber-emerald/30 text-cyber-emerald text-xs font-semibold hover:bg-cyber-emerald/20 transition-colors"
                title="NovaFact Verified Claim"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified {post.fact_check_score}%</span>
              </button>
            )}

            {post.fact_check_status === 'NUANCED' && (
              <button
                onClick={() => onOpenFactCheck(post)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold hover:bg-amber-500/20 transition-colors"
                title="NovaFact Contextual Nuance"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Nuanced {post.fact_check_score}%</span>
              </button>
            )}

            {isAuthor && (
              <button
                onClick={handleDelete}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                title="Delete Post"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Post Content */}
        <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-line font-normal">
          {formatContent(post.content)}
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {post.tags.map((t, idx) => (
              <span
                key={idx}
                className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 hover:text-brand-300 hover:bg-slate-700/80 cursor-pointer transition-colors"
              >
                {t.startsWith('#') ? t : `#${t}`}
              </span>
            ))}
          </div>
        )}

        {/* Reaction Bar & Discussion Bar */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
          {/* Reaction Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleToggleReaction('heart')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                reactions.user_reaction === 'heart'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : 'bg-slate-800/40 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${reactions.user_reaction === 'heart' ? 'fill-rose-400' : ''}`} />
              <span>{reactions.heart || 0}</span>
            </button>

            <button
              onClick={() => handleToggleReaction('flame')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                reactions.user_reaction === 'flame'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-slate-800/40 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>{reactions.flame || 0}</span>
            </button>

            <button
              onClick={() => handleToggleReaction('lightbulb')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                reactions.user_reaction === 'lightbulb'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                  : 'bg-slate-800/40 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>{reactions.lightbulb || 0}</span>
            </button>
          </div>

          {/* Thread Summary & Comments Toggles */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenSummarize(post.id)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 text-brand-300 border border-brand-500/20 text-xs font-semibold transition-colors"
              title="Autonomous Consensus & Debate Synthesis"
            >
              <Layers className="w-3.5 h-3.5 text-brand-400" />
              <span className="hidden sm:inline">AI Synthesis</span>
            </button>

            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700/60 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
              <span>{post.comments_count} Discussion</span>
            </button>
          </div>
        </div>

        {/* Comment Section Drawer */}
        {showComments && (
          <CommentSection
            postId={post.id}
            onCommentAdded={onPostUpdated}
          />
        )}
      </div>
    </article>
  );
};

