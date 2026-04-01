from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    port: int = 8000
    environment: str = "development"
    mongodb_uri: str | None = None
    mongodb_db_name: str = "finance-ai-manager"
    server_base_url: str = "http://localhost:4000"
    openai_api_key: str | None = None
    openai_model: str = "gpt-4o-mini"
    gemini_key: str | None = None
    gemini_model: str = "gemini-2.0-flash"
    claude_key: str | None = None
    claude_model: str = "claude-3-5-haiku-latest"
    kimi_key: str | None = None
    kimi_model: str = "kimi-k2.5"
    perplexity_key: str | None = None
    perplexity_model: str = "sonar"
    groq_key: str | None = None
    groq_model: str = "llama-3.1-8b-instant"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
