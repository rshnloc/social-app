from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.schemas.user import UserResponse

class CommentCreate(BaseModel):
    content: str
    parent_id: Optional[int] = None
    auto_redact_pii: bool = True

class CommentResponse(BaseModel):
    id: int
    post_id: int
    author_id: int
    parent_id: Optional[int] = None
    content: str
    ai_generated: bool
    ai_role: Optional[str] = None
    pii_scanned: bool
    pii_risk_score: int
    created_at: datetime
    author: UserResponse

    class Config:
        from_attributes = True
