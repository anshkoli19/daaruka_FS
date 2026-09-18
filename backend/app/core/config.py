import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Falls back to local SQLite so the app runs with zero setup.
    # In production, set DATABASE_URL to a Postgres+PostGIS instance
    # (e.g. Supabase free tier already ships with the PostGIS extension enabled).
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./darukaa.db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-me-in-prod")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    class Config:
        env_file = ".env"


settings = Settings()
IS_SQLITE = settings.DATABASE_URL.startswith("sqlite")
