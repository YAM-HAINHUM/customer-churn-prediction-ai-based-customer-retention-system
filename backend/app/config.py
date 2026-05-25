"""
Application configuration using Pydantic Settings.
All values are loaded from environment variables or .env file.
"""
from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl
from functools import lru_cache
from typing import List


class Settings(BaseSettings):
    # App
    APP_NAME: str = "ChurnPredictor API"
    APP_VERSION: str = "1.0.0"
    APP_DEBUG: bool = False
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # JWT Authentication
    SECRET_KEY: str = "change-me-in-production-use-at-least-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days

    # MongoDB
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "churn_predictor"

    # ML Artifact Paths (relative to backend/)
    MODEL_PATH: str = "ml/artifacts/best_model.pkl"
    SCALER_PATH: str = "ml/artifacts/scaler.pkl"
    ENCODER_PATH: str = "ml/artifacts/encoders.pkl"
    FEATURE_NAMES_PATH: str = "ml/artifacts/feature_names.pkl"

    @property
    def allowed_origins_list(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance."""
    return Settings()


settings = get_settings()
