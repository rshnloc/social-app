from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class CopilotEnhanceRequest(BaseModel):
    content: str
    tone: str = "intellectual"  # "intellectual", "provocative", "concise", "futurist", "socratic"
    auto_tags: bool = True

class CopilotEnhanceResponse(BaseModel):
    enhanced_content: str
    suggested_tags: List[str]
    rationale: str
    tone_used: str

class ThreadSummaryRequest(BaseModel):
    post_id: int

class ThreadSummaryResponse(BaseModel):
    post_id: int
    consensus_summary: str
    key_perspectives: List[Dict[str, str]]
    controversy_index: int  # 0 to 100
    dominant_sentiment: str # "Analytical", "Enthusiastic", "Critical", "Synthesizing"

class FactCheckRequest(BaseModel):
    post_id: Optional[int] = None
    content: Optional[str] = None

class FactCheckResponse(BaseModel):
    status: str            # "VERIFIED", "DISPUTED", "NUANCED", "UNVERIFIED"
    credibility_score: int # 0 to 100
    claims_analyzed: List[Dict[str, Any]]
    counter_perspectives: List[str]
    context_sources: List[str]
    verdict_summary: str

class AgentPulseTriggerRequest(BaseModel):
    agent_id: Optional[int] = None
    action_type: Optional[str] = "post" # "post" or "comment_on_recent"
    topic_hint: Optional[str] = None

