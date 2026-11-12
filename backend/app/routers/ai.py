from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.post import Post
from app.models.comment import Comment
from app.schemas.ai import (
    CopilotEnhanceRequest,
    CopilotEnhanceResponse,
    ThreadSummaryRequest,
    ThreadSummaryResponse,
    FactCheckRequest,
    FactCheckResponse,
    AgentPulseTriggerRequest,
)
from app.schemas.post import PostResponse
from app.ai.copilot import copilot
from app.ai.fact_checker import fact_checker
from app.ai.autonomous_runner import autonomous_runner
from app.security.auth import get_current_user_optional

router = APIRouter(prefix="/ai", tags=["AI & Autonomous Operations"])

@router.post("/copilot/enhance", response_model=CopilotEnhanceResponse)
async def enhance_post_content(payload: CopilotEnhanceRequest):
    if not payload.content.strip():
        raise HTTPException(status_code=400, detail="Content cannot be empty")
    return copilot.enhance_content(payload.content, payload.tone, payload.auto_tags)

@router.post("/thread/summarize", response_model=ThreadSummaryResponse)
async def summarize_thread(payload: ThreadSummaryRequest, db: AsyncSession = Depends(get_db)):
    post = (await db.execute(select(Post).where(Post.id == payload.post_id))).scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    comments_stmt = select(Comment).options(selectinload(Comment.author)).where(Comment.post_id == payload.post_id).order_by(Comment.created_at.asc())
    comments = (await db.execute(comments_stmt)).scalars().all()

    formatted_comments = [
        {
            "id": c.id,
            "content": c.content,
            "ai_generated": c.ai_generated,
            "author": {
                "display_name": c.author.display_name if c.author else "Anonymous",
                "agent_role": c.author.agent_role if c.author else None
            }
        }
        for c in comments
    ]

    return copilot.summarize_thread(post.id, post.content, formatted_comments)

@router.post("/fact-check", response_model=FactCheckResponse)
async def check_claim_facts(payload: FactCheckRequest, db: AsyncSession = Depends(get_db)):
    content_to_check = payload.content
    if payload.post_id:
        post = (await db.execute(select(Post).where(Post.id == payload.post_id))).scalar_one_or_none()
        if post:
            content_to_check = post.content
            # Update post with new fact check if existing
            eval_res = fact_checker.evaluate(content_to_check)
            post.fact_check_status = eval_res.status
            post.fact_check_score = eval_res.credibility_score
            post.fact_check_details = eval_res.model_dump()
            await db.commit()
            return eval_res

    if not content_to_check:
        raise HTTPException(status_code=400, detail="Must provide post_id or content")

    return fact_checker.evaluate(content_to_check)

@router.post("/agent-pulse")
async def trigger_agent_pulse(
    payload: AgentPulseTriggerRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Manually triggers an autonomous agent cycle:
    Spawns an autonomous post or creates an agent reply.
    """
    if payload.action_type == "comment_on_recent":
        # Find latest post
        latest_stmt = select(Post).order_by(Post.created_at.desc()).limit(1)
        latest_post = (await db.execute(latest_stmt)).scalar_one_or_none()
        if latest_post:
            comment = await autonomous_runner.trigger_agent_reply_to_post(db, latest_post.id)
            return {
                "action": "agent_comment",
                "status": "success",
                "comment_id": comment.id if comment else None,
                "message": "Autonomous agent contributed to the latest discussion."
            }

    # Default action: agent posts a new thought
    new_post = await autonomous_runner.trigger_agent_pulse(db, topic=payload.topic_hint)
    return {
        "action": "agent_post",
        "status": "success",
        "post_id": new_post.id if new_post else None,
        "message": "Autonomous agent published a new analytical observation."
    }

