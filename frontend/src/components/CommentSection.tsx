import React, { useState, useEffect } from 'react';
import { Comment } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { GuardianClient } from '../services/guardianClient';
import { Send, Bot, AtSign, ShieldAlert, CornerDownRight } from 'lucide-react';

interface CommentSectionProps {
  postId: number;
  onCommentAdded?: () => void;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ postId, onCommentAdded }) => {
  const { user } = useAuth();
  const { subscribe } = useSocket();
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [autoRedact, setAutoRedact] = useState(true);

  const fetchComments = async () => {
    try {
      const data = await api.getComments(postId);
      setComments(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchComments();

    // Listen for new comments from WebSocket
    const unsubscribe = subscribe('NEW_COMMENT', (msg) => {
      if (msg.post_id === postId) {
        fetchComments();
      }
    });

    return () => unsubscribe();
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user) return;

    try {
      setSubmitting(true);
      await api.addComment(postId, {
        content,
        auto_redact_pii: autoRedact,
      });
      setContent('');
      await fetchComments();
      if (onCommentAdded) onCommentAdded();
    } catch (err: any) {
      alert(err.message || 'Failed to submit comment');
    } finally {
      setSubmitting(false);
    }
  };

  const insertMention = (handle: string) => {
    setContent((prev) => (prev ? `${prev} @${handle} ` : `@${handle} `));
  };

  return (
    <div className="pt-4 mt-2 border-t border-slate-800/80 space-y-4">
      {/* Comments List */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-2">
            No arguments or comments yet. Start the discourse or tag an agent!
          </p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className={`p-3 rounded-xl border text-xs space-y-1.5 transition-all ${
                comment.ai_generated
                  ? 'bg-slate-950/80 border-brand-500/30'
                  : 'bg-slate-950/40 border-slate-800/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={comment.author.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${comment.author.username}`}
                    alt={comment.author.display_name}
                    className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-700"
                  />
                  <span className="font-semibold text-slate-200">
                    {comment.author.display_name}
                  </span>
                  {comment.ai_generated && (
                    <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                      <Bot className="w-2.5 h-2.5" /> Agent
                    </span>
                  )}
                  <span className="text-[10px] text-slate-500">
                    @{comment.author.username}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500">
                  {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="text-slate-300 leading-relaxed pl-7">
                {comment.content}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reply input */}
      {user ? (
        <form onSubmit={handleSubmit} className="space-y-2 pt-1">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Contribute a counter-point or mention @ElenaVance or @CipherX..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1 shadow-md transition-all"
            >
              <Send className="w-3 h-3" />
              <span>Reply</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <span>Mention:</span>
              {['ElenaVance', 'CipherX', 'NovaFact'].map((agent) => (
                <button
                  key={agent}
                  type="button"
                  onClick={() => insertMention(agent)}
                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-brand-300 font-mono text-[10px]"
                >
                  @{agent}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1">
              <input
                type="checkbox"
                id={`redact-${postId}`}
                checked={autoRedact}
                onChange={(e) => setAutoRedact(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-brand-500"
              />
              <label htmlFor={`redact-${postId}`} className="text-slate-400 select-none cursor-pointer">
                Guardian Auto-Redact
              </label>
            </div>
          </div>
        </form>
      ) : (
        <div className="text-xs text-slate-400 text-center py-2 bg-slate-950/40 rounded-xl border border-slate-800/60">
          Sign in or use demo account to participate in this discussion.
        </div>
      )}
    </div>
  );
};

