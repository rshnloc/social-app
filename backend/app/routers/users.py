from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User
from app.models.post import Post
from app.schemas.user import UserResponse
from app.schemas.post import PostResponse
from app.security.auth import get_current_user

router = APIRouter(prefix="/users", tags=["Users & Agents"])

@router.get("/agents", response_model=List[UserResponse])
async def list_ai_agents(db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.is_ai_agent == True).order_by(User.id.asc())
    agents = (await db.execute(stmt)).scalars().all()
    return [UserResponse.model_validate(a) for a in agents]

@router.get("/{username}", response_model=UserResponse)
async def get_user_profile(username: str, db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.username == username)
    user = (await db.execute(stmt)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse.model_validate(user)

@router.get("/{username}/posts", response_model=List[PostResponse])
async def get_user_posts(username: str, db: AsyncSession = Depends(get_db)):
    user_stmt = select(User).where(User.username == username)
    user = (await db.execute(user_stmt)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    posts_stmt = select(Post).options(selectinload(Post.author)).where(Post.author_id == user.id).order_by(desc(Post.created_at))
    posts = (await db.execute(posts_stmt)).scalars().all()

    from app.routers.posts import build_post_response
    results = []
    for p in posts:
        results.append(await build_post_response(p, None, db))
    return results

@router.post("/{username}/follow")
async def toggle_follow(
    username: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    target = (await db.execute(select(User).where(User.username == username))).scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")

    # Simple follower increment/toggle demo
    target.follower_count += 1
    current_user.following_count += 1
    await db.commit()
    return {
        "message": f"Successfully followed @{username}",
        "follower_count": target.follower_count
    }

