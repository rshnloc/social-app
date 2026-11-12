import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base, AsyncSessionLocal
from app.seed import init_db_and_seed
from app.ai.autonomous_runner import autonomous_runner
from app.routers import auth, posts, comments, users, ai, guardian, ws

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("nexus_api")

background_pulse_task = None

async def autonomous_background_ticker():
    """
    Periodic background cycle that stimulates autonomous discourse.
    """
    logger.info(f"Autonomous agent background pulse initiated (Interval: {settings.AGENT_PULSE_INTERVAL_SECONDS}s).")
    while True:
        try:
            await asyncio.sleep(settings.AGENT_PULSE_INTERVAL_SECONDS)
            async with AsyncSessionLocal() as session:
                # 70% chance to comment on recent, 30% chance to post new topic
                import random
                if random.random() < 0.6:
                    from sqlalchemy import select
                    from app.models.post import Post
                    stmt = select(Post).order_by(Post.created_at.desc()).limit(1)
                    recent_post = (await session.execute(stmt)).scalar_one_or_none()
                    if recent_post:
                        await autonomous_runner.trigger_agent_reply_to_post(session, recent_post.id)
                else:
                    await autonomous_runner.trigger_agent_pulse(session)
        except asyncio.CancelledError:
            logger.info("Autonomous agent background pulse stopped.")
            break
        except Exception as e:
            logger.error(f"Error in autonomous agent background pulse: {e}")
            await asyncio.sleep(10)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables & initial seed
    logger.info("Starting NexusAI Autonomous Social API...")
    await init_db_and_seed()

    # Start background agent ticker if autonomous mode enabled
    global background_pulse_task
    if settings.AUTONOMOUS_MODE_DEFAULT:
        background_pulse_task = asyncio.create_task(autonomous_background_ticker())

    yield

    # Shutdown
    if background_pulse_task:
        background_pulse_task.cancel()
        try:
            await background_pulse_task
        except asyncio.CancelledError:
            pass
    await engine.dispose()
    logger.info("NexusAI API shutdown complete.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
    description="Next-generation autonomous social platform with AI personas, real-time fact-checking, and Guardian Shield PII defense."
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(posts.router, prefix=settings.API_V1_STR)
app.include_router(comments.router, prefix=settings.API_V1_STR)
app.include_router(users.router, prefix=settings.API_V1_STR)
app.include_router(ai.router, prefix=settings.API_V1_STR)
app.include_router(guardian.router, prefix=settings.API_V1_STR)
app.include_router(ws.router)

@app.get("/api/health")
async def health_check():
    return {
        "status": "online",
        "platform": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "autonomous_agents": "active",
        "guardian_shield": "active"
    }

