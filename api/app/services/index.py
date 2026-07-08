"""Owns the singleton LlamaIndex objects. Vendor wiring is injected from the provider
factories, keeping this service agnostic to the concrete LLM / embedder / vector store."""
import threading

from llama_index.core import Settings as LlamaSettings
from llama_index.core import VectorStoreIndex
from llama_index.core.node_parser import SentenceSplitter

from ..config import get_settings
from ..providers.embeddings import build_embed_model
from ..providers.llm import build_llm
from ..providers.vector_store import build_vector_store

_index: VectorStoreIndex | None = None
_lock = threading.Lock()


def get_index() -> VectorStoreIndex:
    global _index
    if _index is None:
        with _lock:
            if _index is None:
                settings = get_settings()
                LlamaSettings.llm = build_llm(settings)
                LlamaSettings.embed_model = build_embed_model(settings)
                LlamaSettings.node_parser = SentenceSplitter(
                    chunk_size=settings.chunk_size,
                    chunk_overlap=settings.chunk_overlap,
                )
                vector_store = build_vector_store(settings)
                _index = VectorStoreIndex.from_vector_store(vector_store)
    return _index
