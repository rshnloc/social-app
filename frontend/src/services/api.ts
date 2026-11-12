import { User, Post, Comment, ReactionSummary, GuardianReport, ThreadSummary, FactCheckDetails } from '../types';

const API_BASE = '/api/v1';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('nexus_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  // Auth
  async register(data: { username: string; display_name: string; email: string; password: string }): Promise<{ access_token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Registration failed');
    }
    return res.json();
  },

  async login(data: { username: string; password: string }): Promise<{ access_token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Login failed');
    }
    return res.json();
  },

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Not authenticated');
    return res.json();
  },

  // Posts
  async getPosts(filter_by: string = 'all'): Promise<Post[]> {
    const res = await fetch(`${API_BASE}/posts?filter_by=${filter_by}`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to fetch posts');
    return res.json();
  },

  async createPost(data: {
    content: string;
    media_urls?: string[];
    tags?: string[];
    auto_redact_pii?: boolean;
    ai_generated?: boolean;
    ai_tone?: string;
  }): Promise<Post> {
    const res = await fetch(`${API_BASE}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail?.message || err.detail || 'Failed to publish post');
    }
    return res.json();
  },

  async toggleReaction(postId: number, reactionType: string): Promise<ReactionSummary> {
    const res = await fetch(`${API_BASE}/posts/${postId}/react`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ reaction_type: reactionType }),
    });
    if (!res.ok) throw new Error('Failed to react');
    return res.json();
  },

  async deletePost(postId: number): Promise<void> {
    const res = await fetch(`${API_BASE}/posts/${postId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to delete post');
  },

  // Comments
  async getComments(postId: number): Promise<Comment[]> {
    const res = await fetch(`${API_BASE}/posts/${postId}/comments`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to fetch comments');
    return res.json();
  },

  async addComment(postId: number, data: { content: string; parent_id?: number | null; auto_redact_pii?: boolean }): Promise<Comment> {
    const res = await fetch(`${API_BASE}/posts/${postId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail?.message || err.detail || 'Failed to submit comment');
    }
    return res.json();
  },

  // AI & Autonomous
  async enhancePost(content: string, tone: string = 'intellectual'): Promise<{ enhanced_content: string; suggested_tags: string[]; rationale: string }> {
    const res = await fetch(`${API_BASE}/ai/copilot/enhance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ content, tone, auto_tags: true }),
    });
    if (!res.ok) throw new Error('Copilot enhancement failed');
    return res.json();
  },

  async summarizeThread(postId: number): Promise<ThreadSummary> {
    const res = await fetch(`${API_BASE}/ai/thread/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ post_id: postId }),
    });
    if (!res.ok) throw new Error('Failed to summarize thread');
    return res.json();
  },

  async factCheck(content?: string, postId?: number): Promise<FactCheckDetails> {
    const res = await fetch(`${API_BASE}/ai/fact-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ content, post_id: postId }),
    });
    if (!res.ok) throw new Error('Fact check failed');
    return res.json();
  },

  async triggerAgentPulse(actionType: 'post' | 'comment_on_recent' = 'post', topicHint?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/ai/agent-pulse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ action_type: actionType, topic_hint: topicHint }),
    });
    if (!res.ok) throw new Error('Failed to trigger agent pulse');
    return res.json();
  },

  // Guardian Shield
  async scanContent(text: string): Promise<GuardianReport> {
    const res = await fetch(`${API_BASE}/guardian/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error('Guardian scan failed');
    return res.json();
  },

  async getAgents(): Promise<User[]> {
    const res = await fetch(`${API_BASE}/users/agents`);
    if (!res.ok) throw new Error('Failed to fetch agents');
    return res.json();
  },
};

