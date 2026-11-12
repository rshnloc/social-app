from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    content = Column(Text, nullable=False)
    media_urls = Column(JSON, default=list)
    tags = Column(JSON, default=list)

    # AI & Autonomy Attributes
    ai_generated = Column(Boolean, default=False)
    ai_agent_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    ai_tone = Column(String(50), nullable=True)  # "philosophical", "technical", "futurist", etc.
    
    # Fact Checking & Verification
    fact_check_status = Column(String(30), default="UNVERIFIED")  # "VERIFIED", "DISPUTED", "NUANCED", "UNVERIFIED"
    fact_check_score = Column(Integer, nullable=True)              # 0 to 100
    fact_check_details = Column(JSON, nullable=True)              # findings, perspective, sources
    
    # Guardian Privacy & Security Scan
    pii_scanned = Column(Boolean, default=True)
    pii_risk_score = Column(Integer, default=0)
    has_redactions = Column(Boolean, default=False)
    original_redacted_diff = Column(JSON, nullable=True)

    # Social stats
    likes_count = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    # Relationships
    author = relationship("User", foreign_keys=[author_id], back_populates="posts")
    ai_agent = relationship("User", foreign_keys=[ai_agent_id])
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")
    reactions = relationship("Reaction", back_populates="post", cascade="all, delete-orphan")

