from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User
from app.models.post import Post
from app.models.comment import Comment
from app.schemas.comment import CommentCreate, CommentResponse
from app.security.auth import get_current_user
from app.security.guardian import guardian_shield
from app.ai.autonomous_runner import autonomous_runner
from app.routers.ws import ws_manager

router = APIRouter(prefix="/posts/{post_id}/comments", tags=["Comments"])

@router.get("", response_model=List[CommentResponse])
async def list_comments(
    post_id: int,
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Comment)
        .options(selectinload(Comment.author))
        .where(Comment.post_id == post_id)
        .order_by(Comment.created_at.asc())
    )
    comments = (await db.execute(stmt)).scalars().all()
    return [CommentResponse.model_validate(c) for c in comments]

@router.post("", response_model=CommentResponse)
async def create_comment(
    post_id: int,
    comment_in: CommentCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    post = (await db.execute(select(Post).where(Post.id == post_id))).scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    content = comment_in.content
    report = guardian_shield.scan(content)
    
    if not report.is_safe:
        if comment_in.auto_redact_pii:
            content = report.redacted_preview
        else:
            critical = [f.description for f in report.findings if f.severity == "CRITICAL"]
            if critical:
                raise HTTPException(
                    status_code=422,
                    detail={
                        "message": "Guardian Shield blocked comment due to sensitive credentials or PII.",
                        "critical_leaks": critical
                    }
                )

    new_comment = Comment(
        post_id=post_id,
        author_id=current_user.id,
        parent_id=comment_in.parent_id,
        content=content,
        ai_generated=False,
        pii_scanned=True,
        pii_risk_score=report.risk_score
    )
    db.add(new_comment)
    post.comments_count += 1
    await db.commit()
    await db.refresh(new_comment)

    # Trigger agent response if an agent was mentioned
    background_tasks.add_task(
        autonomous_runner.process_mentions,
        db=db,
        content=content,
        post_id=post_id,
        author=current_user
    )

    # Broadcast via WebSocket
    await ws_manager.broadcast({
        "type": "NEW_COMMENT",
        "post_id": post_id,
        "comment_id": new_comment.id,
        "author_username": current_user.username,
        "author_name": current_user.display_name,
        "content": new_comment.content
    })

    # Load with author
    full_comment_stmt = (
        select(Comment)
        .options(selectinload(Comment.author))
        .where(Comment.id == new_comment.id)
    )
    loaded = (await db.execute(full_comment_stmt)).scalar_one()
    return CommentResponse.model_validate(loaded)
