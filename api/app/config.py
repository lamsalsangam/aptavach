"""Central configuration. Everything that could change between environments or providers is
here and .env-driven (prefix APTAVACH_), so no vendor detail is hard-coded in the app."""
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_prefix="APTAVACH_", extra="ignore"
    )

    # --- App ---
    app_name: str = "Aptavach"
    environment: str = "development"
    cors_origins: list[str] = ["http://localhost:5173"]

    # --- Storage (gitignored runtime data) ---
    storage_dir: Path = Path("storage")

    # --- Ollama ---
    ollama_base_url: str = "http://localhost:11434"
    request_timeout: float = 120.0

    # --- LLM (generation) ---
    llm_provider: str = "ollama"
    llm_model: str = "qwen2.5:7b"
    context_window: int = 8192
    llm_api_key: str | None = None

    # --- Embeddings ---
    embed_provider: str = "ollama"
    embed_model: str = "bge-m3"

    # --- Vector store (Qdrant) ---
    qdrant_location: str = "local"  # "local" (embedded) | "server"
    qdrant_path: Path = Path("storage/qdrant")
    qdrant_url: str | None = None
    qdrant_api_key: str | None = None
    collection_name: str = "aptavach"

    # --- Retrieval / chunking ---
    chunk_size: int = 1024
    chunk_overlap: int = 128
    similarity_top_k: int = 5

    @property
    def uploads_dir(self) -> Path:
        return self.storage_dir / "uploads"


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    for directory in (settings.storage_dir, settings.uploads_dir, settings.qdrant_path):
        directory.mkdir(parents=True, exist_ok=True)
    return settings
