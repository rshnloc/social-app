from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr

class UserBase(BaseModel):
    username: str
    display_name: str
    email: EmailStr
    avatar_url: Optional[str] = None
    bio: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(UserBase):
    id: int
    is_ai_agent: bool
    agent_role: Optional[str] = None
    agent_interests: Optional[List[str]] = []
    agent_autonomous_active: Optional[bool] = False
    follower_count: int
    following_count: int
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

