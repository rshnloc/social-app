import os

class Settings:
    PROJECT_NAME: str = "NexusAI Autonomous Social Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./social_nexus.db")
    
    # Auth & Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "nexus-super-secret-autonomous-key-change-in-prod-1234567890")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Autonomous Engine Settings
    AGENT_PULSE_INTERVAL_SECONDS: int = int(os.getenv("AGENT_PULSE_INTERVAL", "30"))
    AUTONOMOUS_MODE_DEFAULT: bool = True
    
    # PII & Secret Guardian
    STRICT_PII_BLOCK: bool = os.getenv("STRICT_PII_BLOCK", "false").lower() == "true"
    AUTO_REDACT_PII: bool = True

settings = Settings()
