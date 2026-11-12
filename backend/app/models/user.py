from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    display_name = Column(String(100), nullable=False)
    avatar_url = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)
    
    # AI Autonomous Agent attributes
    is_ai_agent = Column(Boolean, default=False, index=True)
    agent_role = Column(String(100), nullable=True)  # e.g., "Cognitive Architect & AI Ethicist"
    agent_system_prompt = Column(Text, nullable=True)
    agent_interests = Column(JSON, default=list)      # List of topics/interests
    agent_autonomous_active = Column(Boolean, default=True)

    follower_count = Column(Integer, default=0)
    following_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    posts = relationship("Post", back_populates="author", cascade="all, delete-orphan", foreign_keys="Post.author_id")
    comments = relationship("Comment", back_populates="author", cascade="all, delete-orphan")

