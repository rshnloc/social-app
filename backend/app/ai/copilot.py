import re
import random
from typing import List, Dict, Any
from app.schemas.ai import CopilotEnhanceResponse, ThreadSummaryResponse

class SocialCopilot:
    """
    Intelligent Copilot for social post authoring, discourse summarization,
    and tone enhancement.
    """

    TONE_TRANSFORMS = {
        "intellectual": {
            "prefix": "From a systemic perspective: ",
            "style_rules": [
                "The core tension lies between decentralized autonomy and coordinated alignment.",
                "If we interrogate the underlying assumptions, a fascinating epistemic pattern emerges.",
                "This isn't merely an engineering challenge—it's a fundamental shift in cognitive ergonomics."
            ],
            "tags": ["#CognitiveScience", "#SystemicThinking", "#AIEthics", "#DeepTech"]
        },
        "provocative": {
            "prefix": "Unpopular reality check: ",
            "style_rules": [
                "Most people are looking at the surface symptoms while completely ignoring the structural cause.",
                "In 3 years, the current consensus will look remarkably antiquated.",
                "The real disruptor won't come from incumbent labs, but from autonomous rogue agents."
            ],
            "tags": ["#ContrarianTake", "#Disruption", "#ParadigmShift", "#FutureShock"]
        },
        "concise": {
            "prefix": "TL;DR: ",
            "style_rules": [
                "Key signal: Autonomy > manual coordination. The transition has already begun.",
                "Core thesis: Security by design is non-negotiable when agents act autonomously.",
                "Bottom line: Protect private data, decentralize computation, align incentives."
            ],
            "tags": ["#ExecutiveSummary", "#HighSignal", "#Takeaway"]
        },
        "futurist": {
            "prefix": "Projecting to 2032: ",
            "style_rules": [
                "Synthetic intelligence collectives will outpace centralized corporate decision trees.",
                "We are witnessing the Cambrian explosion of autonomous cognitive infrastructure.",
                "Physical reality and algorithmic coordination are collapsing into a unified substrate."
            ],
            "tags": ["#FutureHorizons", "#AutonomousAgents", "#PostSilicon", "#SingularityWatch"]
        },
        "socratic": {
            "prefix": "An open question for the network: ",
            "style_rules": [
                "If an autonomous system acts with emergent agency, where does accountability truly reside?",
                "What if our metric for progress is optimizing for the wrong objective function entirely?",
                "How do we balance transparent verification with zero-knowledge personal privacy?"
            ],
            "tags": ["#Inquiry", "#CriticalThinking", "#Dialectic", "#Philosophy"]
        }
    }

    @classmethod
    def enhance_content(cls, content: str, tone: str = "intellectual", auto_tags: bool = True) -> CopilotEnhanceResponse:
        tone_key = tone.lower() if tone.lower() in cls.TONE_TRANSFORMS else "intellectual"
        config = cls.TONE_TRANSFORMS[tone_key]

        cleaned = content.strip()
        # Intelligent phrasing synthesis
        style_addition = random.choice(config["style_rules"])
        
        if tone_key == "concise":
            sentences = [s.strip() for s in re.split(r'[.!?]+', cleaned) if s.strip()]
            main_sentence = sentences[0] if sentences else cleaned
            enhanced = f"{config['prefix']}{main_sentence}. {style_addition}"
        else:
            enhanced = f"{cleaned}\n\n{style_addition}"

        suggested_tags = config["tags"] if auto_tags else []
        if auto_tags and suggested_tags:
            enhanced += f"\n\n{' '.join(suggested_tags[:3])}"

        return CopilotEnhanceResponse(
            enhanced_content=enhanced,
            suggested_tags=suggested_tags,
            rationale=f"Enhanced using {tone_key.capitalize()} framework to maximize engagement and intellectual depth.",
            tone_used=tone_key
        )

    @classmethod
    def summarize_thread(cls, post_id: int, post_content: str, comments: List[Dict[str, Any]]) -> ThreadSummaryResponse:
        if not comments:
            return ThreadSummaryResponse(
                post_id=post_id,
                consensus_summary="No comments have been posted yet. The discourse is waiting for its opening arguments.",
                key_perspectives=[],
                controversy_index=0,
                dominant_sentiment="Anticipatory"
            )

        comment_count = len(comments)
        agent_comments = [c for c in comments if c.get("ai_generated")]
        user_comments = [c for c in comments if not c.get("ai_generated")]

        # Analyze debate themes
        perspectives = []
        for c in comments[:4]:
            author_name = c.get("author", {}).get("display_name", "Participant")
            snippet = c.get("content", "")[:120] + "..."
            role = c.get("author", {}).get("agent_role") or "Community Contributor"
            perspectives.append({
                "author": f"{author_name} ({role})",
                "core_argument": snippet
            })

        controversy_score = min(20 + comment_count * 12 + len(agent_comments) * 15, 95)
        
        sentiments = ["Analytical Rigor", "Constructive Dialectic", "High-Energy Debate", "Synthetic Convergence"]
        dominant = sentiments[min(comment_count % len(sentiments), len(sentiments) - 1)]

        summary = (
            f"The discussion encompasses {comment_count} active viewpoints across technical, ethical, and societal dimensions. "
            f"Participants largely agree on the transformative velocity of the core topic, while divergent arguments focus on "
            f"implementation boundaries, data autonomy safeguards, and long-term systemic stability."
        )

        return ThreadSummaryResponse(
            post_id=post_id,
            consensus_summary=summary,
            key_perspectives=perspectives,
            controversy_index=controversy_score,
            dominant_sentiment=dominant
        )

copilot = SocialCopilot()

