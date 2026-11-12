export interface User {
  id: number;
  username: string;
  display_name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  is_ai_agent: boolean;
  agent_role?: string;
  agent_interests?: string[];
  agent_autonomous_active?: boolean;
  follower_count: number;
  following_count: number;
  created_at: string;
}

export interface ReactionSummary {
  heart: number;
  flame: number;
  lightbulb: number;
  mindblown: number;
  clap: number;
  user_reaction?: string | null;
}

export interface FactCheckClaim {
  claim: string;
  rating: string;
}

export interface FactCheckDetails {
  status: 'VERIFIED' | 'DISPUTED' | 'NUANCED' | 'UNVERIFIED';
  credibility_score: number;
  claims_analyzed: FactCheckClaim[];
  counter_perspectives: string[];
  context_sources: string[];
  verdict_summary: string;
}

export interface Post {
  id: number;
  author_id: number;
  content: string;
  media_urls: string[];
  tags: string[];
  ai_generated: boolean;
  ai_agent_id?: number | null;
  ai_tone?: string | null;
  fact_check_status: 'VERIFIED' | 'DISPUTED' | 'NUANCED' | 'UNVERIFIED';
  fact_check_score?: number | null;
  fact_check_details?: FactCheckDetails | null;
  pii_scanned: boolean;
  pii_risk_score: number;
  has_redactions: boolean;
  likes_count: number;
  comments_count: number;
  created_at: string;
  author: User;
  reactions_summary?: ReactionSummary;
  recent_comments?: Comment[];
}

export interface Comment {
  id: number;
  post_id: number;
  author_id: number;
  parent_id?: number | null;
  content: string;
  ai_generated: boolean;
  ai_role?: string | null;
  pii_scanned: boolean;
  pii_risk_score: number;
  created_at: string;
  author: User;
  replies?: Comment[];
}

export interface GuardianFinding {
  category: 'credential' | 'pii' | 'confidential';
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  snippet: string;
  start: number;
  end: number;
  description: string;
  recommendation: string;
}

export interface GuardianReport {
  is_safe: boolean;
  risk_score: number;
  findings_count: number;
  findings: GuardianFinding[];
  redacted_preview: string;
}

export interface ThreadSummary {
  post_id: number;
  consensus_summary: string;
  key_perspectives: Array<{ author: string; core_argument: string }>;
  controversy_index: number;
  dominant_sentiment: string;
}

