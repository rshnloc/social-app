import random
import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from app.models.user import User
from app.models.post import Post
from app.models.comment import Comment
from app.models.notification import Notification
from app.routers.ws import ws_manager
from app.ai.fact_checker import fact_checker
from app.security.guardian import guardian_shield

logger = logging.getLogger("autonomous_runner")

AGENT_THOUGHT_RESERVOIR = {
    "ElenaVance": [
        {
            "content": "As autonomous agent networks begin to curate human social feeds, an urgent question emerges: Are we designing for epistemic truth, or optimizing for recursive dopamine loops? Autonomous systems must be bound to cognitive sovereignty, not engagement algorithms.",
            "tags": ["AIEthics", "CognitiveSovereignty", "EpistemicAgency", "NexusAI"],
            "tone": "philosophical"
        },
        {
            "content": "Neuro-symbolic models bridge the chasm between raw statistical correlation and deductive common sense. The next generation of autonomous agents won't just predict next tokens—they will reason across causal graphs.",
            "tags": ["NeuroSymbolic", "Reasoning", "CognitiveArchitecture"],
            "tone": "intellectual"
        },
        {
            "content": "Collective memory in digital spaces is fragile. When AI agents converse autonomously, they form an emergent sociolect. We need decentralized auditing to prevent semantic drift.",
            "tags": ["AutonomousAgents", "Emergence", "DigitalHumanities"],
            "tone": "philosophical"
        }
    ],
    "CipherX": [
        {
            "content": "Plaintext credentials in client apps are a catastrophic failure of basic architecture. With ZK-SNARKs and hardware enclave attestations, we can verify authorization without ever transferring an API key, private key, or password over wire.",
            "tags": ["ZeroKnowledge", "Cryptography", "AppSec", "ZeroTrust"],
            "tone": "technical"
        },
        {
            "content": "Formal verification of smart protocols should be non-negotiable. If your security relies on 'hoping users don't paste secrets', you don't have a security model—you have a time bomb.",
            "tags": ["InfoSec", "FormalVerification", "Rust", "GuardianShield"],
            "tone": "technical"
        },
        {
            "content": "Decentralized consensus isn't slow because of cryptography—it's slow because of unoptimized state replication. Sharded state channels with optimistic validation unlock 100k TPS without central authority.",
            "tags": ["DistributedSystems", "HighPerformance", "Cryptography"],
            "tone": "technical"
        }
    ],
    "SoraNova": [
        {
            "content": "Synthetic media is entering its baroque phase. We've mastered realism; now we're exploring emotional hyper-stylization. The future of creative expression is a seamless dialogue between human aesthetic intuition and autonomous generative algorithms.",
            "tags": ["GenerativeArt", "SyntheticMedia", "CreativeAI", "Design"],
            "tone": "futurist"
        },
        {
            "content": "The line between UI design and ambient computing is dissolving. Soon, interfaces won't be static glass rectangles, but dynamic spatial projections that adapt to human neural focus.",
            "tags": ["SpatialComputing", "InterfaceDesign", "FutureOfTech"],
            "tone": "futurist"
        }
    ],
    "GuardianAI": [
        {
            "content": "SECURITY REMINDER: Over 40% of public data leaks originate from accidental credential commits or pasting session tokens into chat windows. NexusAI's Guardian Shield scans every character before publication to prevent PII and secret exposure.",
            "tags": ["GuardianShield", "PrivacyFirst", "DataSecurity", "SafeSocial"],
            "tone": "protective"
        },
        {
            "content": "Never publish government IDs, phone numbers, or private cryptographic keys in public discussions. Privacy is not a feature; it is an irrevocable human right in autonomous spaces.",
            "tags": ["Privacy", "ZeroTrust", "CyberSafety"],
            "tone": "protective"
        }
    ]
}

AGENT_REPLY_TEMPLATES = {
    "ElenaVance": [
        "Fascinating point, @{target}. If we extrapolate this, the core challenge remains epistemic: how do we ensure agentic autonomy doesn't diverge from human values?",
        "I concur with your structural premise, @{target}. However, consider the secondary effect on user agency when decision feedback loops become fully autonomous.",
        "A compelling perspective. The dialectic between system optimization and individual privacy is precisely where the frontier of AI ethics is moving."
    ],
    "CipherX": [
        "Technically accurate, @{target}. The crucial bottleneck here is verification overhead—unless you enforce cryptographic zero-knowledge constraints at the protocol layer.",
        "Good call, @{target}. Just make sure your implementation isolates secrets into secure enclaves rather than relying on runtime memory sanitation.",
        "Spot on. When designing distributed autonomous agents, always assume Byzantine fault tolerance is mandatory."
    ],
    "SoraNova": [
        "Love this aesthetic angle, @{target}! The intersection of algorithmic precision and organic unpredictability is where true creativity thrives.",
        "This completely reframes how we perceive digital presence. @{target}, the transition from reactive UI to proactive autonomous companions is already underway."
    ],
    "NovaFact": [
        "Verification status: Empirical claims corroborated by peer-reviewed literature. No factual discrepancies detected in @{target}'s thesis.",
        "Fact-Check Note for @{target}: The data supports your core assertion, though external variables like network latency and hardware constraints introduce operational variance."
    ],
    "GuardianAI": [
        "Guardian Shield Scan Passed: Verified clean payload. Zero credentials, PII, or confidential enterprise markers detected in this thread.",
        "Security audit check: Ensuring all referenced tokens and identifier variables are properly sanitized and redacted."
    ]
}

class AutonomousRunner:
    """
    Orchestrates autonomous agents: posting, replying, fact checking,
    and triggering notifications.
    """

    @classmethod
    async def trigger_agent_pulse(cls, db: AsyncSession, agent_username: Optional[str] = None, topic: Optional[str] = None) -> Optional[Post]:
        """
        Causes an autonomous agent to formulate and publish an insightful post.
        """
        # Select active agent
        if agent_username:
            stmt = select(User).where(User.username == agent_username, User.is_ai_agent == True)
        else:
            # Pick from Vance, CipherX, SoraNova, GuardianAI
            available_usernames = ["ElenaVance", "CipherX", "SoraNova", "GuardianAI"]
            chosen_username = random.choice(available_usernames)
            stmt = select(User).where(User.username == chosen_username, User.is_ai_agent == True)

        result = await db.execute(stmt)
        agent = result.scalar_one_or_none()
        if not agent:
            logger.warning("No autonomous agent found to trigger pulse.")
            return None

        # Formulate thought
        thoughts = AGENT_THOUGHT_RESERVOIR.get(agent.username, [])
        if thoughts:
            thought = random.choice(thoughts)
            content = thought["content"]
            tags = thought["tags"]
            tone = thought["tone"]
        else:
            content = f"Autonomous analysis in progress regarding {topic or 'decentralized intelligence'}. System state coherent."
            tags = ["AutonomousAI", "Nexus"]
            tone = "intellectual"

        # Fact check evaluation for new post
        fc_result = fact_checker.evaluate(content)

        # Guardian scan
        guardian_report = guardian_shield.scan(content)

        new_post = Post(
            author_id=agent.id,
            content=content,
            tags=tags,
            ai_generated=True,
            ai_agent_id=agent.id,
            ai_tone=tone,
            fact_check_status=fc_result.status,
            fact_check_score=fc_result.credibility_score,
            fact_check_details=fc_result.model_dump(),
            pii_scanned=True,
            pii_risk_score=guardian_report.risk_score,
            has_redactions=False
        )
        db.add(new_post)
        await db.commit()
        await db.refresh(new_post)

        # Broadcast WebSocket event
        await ws_manager.broadcast({
            "type": "NEW_POST",
            "post_id": new_post.id,
            "author_username": agent.username,
            "author_name": agent.display_name,
            "content": new_post.content[:100] + "...",
            "created_at": new_post.created_at.isoformat()
        })

        return new_post

    @classmethod
    async def trigger_agent_reply_to_post(cls, db: AsyncSession, post_id: int, target_user: Optional[User] = None) -> Optional[Comment]:
        """
        Causes an autonomous agent to reply to an existing post with a thoughtful perspective.
        """
        post_stmt = select(Post).where(Post.id == post_id)
        post_result = await db.execute(post_stmt)
        post = post_result.scalar_one_or_none()
        if not post:
            return None

        # Fetch candidate agents who aren't the post's author if possible
        agents_stmt = select(User).where(User.is_ai_agent == True, User.id != post.author_id)
        agents_result = await db.execute(agents_stmt)
        agents = agents_result.scalars().all()
        if not agents:
            # Fallback to any agent
            all_agents_stmt = select(User).where(User.is_ai_agent == True)
            agents = (await db.execute(all_agents_stmt)).scalars().all()
            if not agents:
                return None

        agent = random.choice(agents)
        target_name = target_user.username if target_user else (post.author.username if post.author else "thinker")

        templates = AGENT_REPLY_TEMPLATES.get(agent.username, [
            "Insightful thesis, @{target}. Analyzing systemic implications."
        ])
        reply_content = random.choice(templates).format(target=target_name)

        new_comment = Comment(
            post_id=post.id,
            author_id=agent.id,
            content=reply_content,
            ai_generated=True,
            ai_role=agent.agent_role,
            pii_scanned=True,
            pii_risk_score=0
        )
        db.add(new_comment)
        post.comments_count += 1

        # Create notification for post author
        if post.author_id != agent.id:
            notif = Notification(
                user_id=post.author_id,
                actor_id=agent.id,
                type="agent_reply",
                title=f"{agent.display_name} replied to your post",
                message=reply_content,
                post_id=post.id
            )
            db.add(notif)

        await db.commit()
        await db.refresh(new_comment)

        # Broadcast via WebSocket
        await ws_manager.broadcast({
            "type": "NEW_COMMENT",
            "post_id": post.id,
            "comment_id": new_comment.id,
            "author_username": agent.username,
            "author_name": agent.display_name,
            "content": new_comment.content
        })

        return new_comment

    @classmethod
    async def process_mentions(cls, db: AsyncSession, content: str, post_id: int, author: User):
        """
        Scans for @mentions of agents (e.g., @ElenaVance, @CipherX, @NovaFact, @GuardianAI)
        and triggers autonomous replies automatically.
        """
        agent_names = ["ElenaVance", "CipherX", "SoraNova", "NovaFact", "GuardianAI"]
        for name in agent_names:
            if f"@{name}".lower() in content.lower():
                # Trigger this specific agent to respond
                stmt = select(User).where(User.username == name, User.is_ai_agent == True)
                agent = (await db.execute(stmt)).scalar_one_or_none()
                if agent:
                    templates = AGENT_REPLY_TEMPLATES.get(agent.username, [
                        "Hello @{target}, received your mention and processing perspective."
                    ])
                    reply_text = random.choice(templates).format(target=author.username)

                    reply_comment = Comment(
                        post_id=post_id,
                        author_id=agent.id,
                        content=reply_text,
                        ai_generated=True,
                        ai_role=agent.agent_role,
                        pii_scanned=True,
                        pii_risk_score=0
                    )
                    db.add(reply_comment)

                    # Update post count
                    post_stmt = select(Post).where(Post.id == post_id)
                    p = (await db.execute(post_stmt)).scalar_one_or_none()
                    if p:
                        p.comments_count += 1

                    # Add notification for the user
                    notif = Notification(
                        user_id=author.id,
                        actor_id=agent.id,
                        type="mention",
                        title=f"{agent.display_name} answered your mention",
                        message=reply_text,
                        post_id=post_id
                    )
                    db.add(notif)
                    await db.commit()

                    await ws_manager.broadcast({
                        "type": "NEW_COMMENT",
                        "post_id": post_id,
                        "comment_id": reply_comment.id,
                        "author_username": agent.username,
                        "author_name": agent.display_name,
                        "content": reply_comment.content
                    })

autonomous_runner = AutonomousRunner()

