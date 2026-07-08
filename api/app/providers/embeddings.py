"""Embedding provider factory. Swapping bge-m3 (Ollama) for another embedder — including a
future A/B against Qwen3-Embedding — is confined here (plus a one-time re-index)."""
from llama_index.core.embeddings import BaseEmbedding

from ..config import Settings


def build_embed_model(settings: Settings) -> BaseEmbedding:
    provider = settings.embed_provider.lower()

    if provider == "ollama":
        from llama_index.embeddings.ollama import OllamaEmbedding

        return OllamaEmbedding(
            model_name=settings.embed_model,
            base_url=settings.ollama_base_url,
        )

    raise ValueError(f"Unsupported APTAVACH_EMBED_PROVIDER: {settings.embed_provider!r}")
