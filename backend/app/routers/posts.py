from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User
from app.models.post import Post
from app.models.reaction import Reaction
from app.models.comment import Comment
from app.schemas.post import PostCreate, PostResponse, ReactionToggleRequest, ReactionSummary
from app.schemas.comment import CommentResponse
from app.security.auth import get_current_user, get_current_user_optional
from app.security.guardian import guardian_shield
from app.ai.fact_checker import fact_checker
from app.ai.autonomous_runner import autonomous_runner
from app.routers.ws import ws_manager

router = APIRouter(prefix="/posts", tags=["Posts"])

async def build_post_response(post: Post, current_user_id: Optional[int], db: AsyncSession) -> PostResponse:
    # Calculate reactions summary
    stmt_reactions = select(Reaction.reaction_type, func.count(Reaction.id)).where(Reaction.post_id == post.id).group_by(Reaction.reaction_type)
    reaction_rows = (await db.execute(stmt_reactions)).all()
    
    summary = ReactionSummary()
    for r_type, count in reaction_rows:
        if hasattr(summary, r_type):
            setattr(summary, r_type, count)

    if current_user_id:
        user_react_stmt = select(Reaction.reaction_type).where(
            Reaction.post_id == post.id,
            Reaction.user_id == current_user_id
        )
        summary.user_reaction = (await db.execute(user_react_stmt)).scalar_one_or_none()

    # Load recent 3 comments
    comments_stmt = select(Comment).options(selectinload(Comment.author)).where(Comment.post_id == post.id).order_by(desc(Comment.created_at)).limit(3)
    comments = (await db.execute(comments_stmt)).scalars().all()
    recent_comments = [CommentResponse.model_validate(c) for c in comments]

    resp = PostResponse.model_validate(post)
    resp.reactions_summary = summary
    resp.recent_comments = recent_comments
    return resp

@router.get("", response_model=List[PostResponse])
async def list_posts(
    filter_by: str = Query("all", pattern="^(all|agents|verified|trending)$"),
    tag: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    query = select(Post).options(selectinload(Post.author))

    if filter_by == "agents":
        query = query.where(Post.ai_generated == True)
    elif filter_by == "verified":
        query = query.where(Post.fact_check_status == "VERIFIED")
    elif filter_by == "trending":
        query = query.order_by(desc(Post.likes_count + Post.comments_count * 2), desc(Post.created_at))
    else:
        query = query.order_by(desc(Post.created_at))

    query = query.limit(limit).offset(offset)
    posts = (await db.execute(query)).scalars().all()

    current_user_id = current_user.id if current_user else None
    results = []
    for p in posts:
        results.append(await build_post_response(p, current_user_id, db))
    return results

@router.post("", response_model=PostResponse)
async def create_post(
    post_in: PostCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    raw_content = post_in.content
    
    # 1. Guardian Shield: Scan for Credentials, PII, and Confidential Data
    report = guardian_shield.scan(raw_content)

    final_content = raw_content
    has_redactions = False

    if not report.is_safe:
        if post_in.auto_redact_pii:
            final_content = report.redacted_preview
            has_redactions = True
        else:
            # If critical credential leak and not auto-redacted
            critical_findings = [f.description for f in report.findings if f.severity == "CRITICAL"]
            if critical_findings:
                raise HTTPException(
                    status_code=422,
                    detail={
                        "message": "Guardian Shield blocked this post to protect sensitive credentials/PII.",
                        "critical_leaks": critical_findings,
                        "suggestion": "Enable auto-redaction or remove credentials before posting."
                    }
                )

    # 2. Fact Check Evaluation
    fc_result = fact_checker.evaluate(final_content)

    new_post = Post(
        author_id=current_user.id,
        content=final_content,
        media_urls=post_in.media_urls or [],
        tags=post_in.tags or [],
        ai_generated=post_in.ai_generated,
        ai_tone=post_in.ai_tone,
        fact_check_status=fc_result.status,
        fact_check_score=fc_result.credibility_score,
        fact_check_details=fc_result.model_dump(),
        pii_scanned=True,
        pii_risk_score=report.risk_score,
        has_redactions=has_redactions
    )
    db.add(new_post)
    await db.commit()
    await db.refresh(new_post)

    # 3. Process mentions in background
    background_tasks.add_task(
        autonomous_runner.process_mentions,
        db=db,
        content=final_content,
        post_id=new_post.id,
        author=current_user
    )

    # 4. Broadcast live WebSocket event
    await ws_manager.broadcast({
        "type": "NEW_POST",
        "post_id": new_post.id,
        "author_username": current_user.username,
        "author_name": current_user.display_name,
        "content": new_post.content[:100] + "...",
        "created_at": new_post.created_at.isoformat()
    })

    # Return formatted post
    query = select(Post).options(selectinload(Post.author)).where(Post.id == new_post.id)
    created_post = (await db.execute(query)).scalar_one()
    return await build_post_response(created_post, current_user.id, db)

@router.get("/{post_id}", response_model=PostResponse)
async def get_post(
    post_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    query = select(Post).options(selectinload(Post.author)).where(Post.id == post_id)
    post = (await db.execute(query)).scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    current_user_id = current_user.id if current_user else None
    return await build_post_response(post, current_user_id, db)

@router.post("/{post_id}/react", response_model=ReactionSummary)
async def toggle_reaction(
    post_id: int,
    reaction_data: ReactionToggleRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    post = (await db.execute(select(Post).where(Post.id == post_id))).scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    reaction_stmt = select(Reaction).where(
        Reaction.post_id == post_id,
        Reaction.user_id == current_user.id,
        Reaction.reaction_type == reaction_data.reaction_type
    )
    existing_reaction = (await db.execute(reaction_stmt)).scalar_one_or_none()

    if existing_reaction:
        await db.delete(existing_reaction)
        post.likes_count = max(0, post.likes_count - 1)
        await db.commit()
    else:
        # Also remove other reaction if single reaction per user is preferred, or allow multiple types
        new_reaction = Reaction(
            post_id=post_id,
            user_id=current_user.id,
            reaction_type=reaction_data.reaction_type
        )
        db.add(new_reaction)
        post.likes_count += 1
        await db.commit()

    # Re-calculate summary
    summary_stmt = select(Reaction.reaction_type, func.count(Reaction.id)).where(Reaction.post_id == post_id).group_by(Reaction.reaction_type)
    reaction_rows = (await db.execute(summary_stmt)).all()
    summary = ReactionSummary()
    for r_type, count in reaction_rows:
        if hasattr(summary, r_type):
            setattr(summary, r_type, count)
    
    # Check if user has active reaction
    active_stmt = select(Reaction.reaction_type).where(
        Reaction.post_id == post_id,
        Reaction.user_id == current_user.id
    )
    summary.user_reaction = (await db.execute(active_stmt)).scalar_one_or_none()
    return summary

@router.delete("/{post_id}")
async def delete_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    post = (await db.execute(select(Post).where(Post.id == post_id))).scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")

    await db.delete(post)
    await db.commit()
    return {"message": "Post deleted successfully", "post_id": post_id}
