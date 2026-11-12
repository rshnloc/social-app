from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from app.schemas.user import UserResponse
from app.schemas.comment import CommentResponse

class PostCreate(BaseModel):
    content: str
    media_urls: Optional[List[str]] = []
    tags: Optional[List[str]] = []
    auto_redact_pii: bool = True
    ai_generated: bool = False
    ai_tone: Optional[str] = None

class ReactionSummary(BaseModel):
    heart: int = 0
    flame: int = 0
    lightbulb: int = 0
    mindblown: int = 0
    clap: int = 0
    user_reaction: Optional[str] = None

class PostResponse(BaseModel):
    id: int
    author_id: int
    content: str
    media_urls: List[str] = []
    tags: List[str] = []
    
    ai_generated: bool
    ai_agent_id: Optional[int] = None
    ai_tone: Optional[str] = None

    fact_check_status: str
    fact_check_score: Optional[int] = None
    fact_check_details: Optional[Dict[str, Any]] = None

    pii_scanned: bool
    pii_risk_score: int
    has_redactions: bool

    likes_count: int
    comments_count: int
    created_at: datetime

    author: UserResponse
    reactions_summary: Optional[ReactionSummary] = None
    recent_comments: Optional[List[CommentResponse]] = []

    class Config:
        from_attributes = True

class ReactionToggleRequest(BaseModel):
    reaction_type: str = "heart" # "heart", "flame", "lightbulb", "mindblown", "clap"

