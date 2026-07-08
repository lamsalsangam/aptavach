"""Vector-store provider factory (Qdrant). Embedded local mode by default; flip to a Qdrant
server/cloud purely via .env, with no code changes anywhere else."""
from llama_index.vector_stores.qdrant import QdrantVectorStore
from qdrant_client import QdrantClient

from ..config import Settings


def build_vector_store(settings: Settings) -> QdrantVectorStore:
    if settings.qdrant_location.lower() == "server":
        client = QdrantClient(url=settings.qdrant_url, api_key=settings.qdrant_api_key)
    else:
        client = QdrantClient(path=str(settings.qdrant_path))

    return QdrantVectorStore(client=client, collection_name=settings.collection_name)
