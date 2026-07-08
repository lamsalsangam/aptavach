"""Document lifecycle: ingest an upload into the index, list what's indexed, and delete it.
A small JSON registry tracks each document's chunk ids so deletions are exact."""
import json
import shutil
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import UploadFile
from llama_index.core import SimpleDirectoryReader
from llama_index.core.node_parser import SentenceSplitter
from starlette.concurrency import run_in_threadpool

from ..config import get_settings
from .index import get_index

_lock = threading.Lock()
_PUBLIC_FIELDS = ("doc_id", "filename", "num_chunks", "size", "uploaded_at")


def _registry_path() -> Path:
    return get_settings().storage_dir / "registry.json"


def _load_registry() -> dict:
    path = _registry_path()
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return {}


def _save_registry(registry: dict) -> None:
    _registry_path().write_text(
        json.dumps(registry, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def has_documents() -> bool:
    return bool(_load_registry())


async def ingest_upload(file: UploadFile) -> dict:
    settings = get_settings()
    doc_id = uuid.uuid4().hex
    safe_name = Path(file.filename or "upload").name
    dest = settings.uploads_dir / f"{doc_id}__{safe_name}"

    with dest.open("wb") as out:
        shutil.copyfileobj(file.file, out)
    size = dest.stat().st_size

    def _index_file() -> list[str]:
        documents = SimpleDirectoryReader(input_files=[str(dest)]).load_data()
        splitter = SentenceSplitter(
            chunk_size=settings.chunk_size, chunk_overlap=settings.chunk_overlap
        )
        nodes = splitter.get_nodes_from_documents(documents)
        for node in nodes:
            node.metadata["doc_id"] = doc_id
            node.metadata["source"] = safe_name
        get_index().insert_nodes(nodes)
        return [node.node_id for node in nodes]

    node_ids = await run_in_threadpool(_index_file)

    entry = {
        "doc_id": doc_id,
        "filename": safe_name,
        "num_chunks": len(node_ids),
        "size": size,
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
        "node_ids": node_ids,
    }
    with _lock:
        registry = _load_registry()
        registry[doc_id] = entry
        _save_registry(registry)

    return {**{k: entry[k] for k in _PUBLIC_FIELDS}, "status": "indexed"}


def list_documents() -> list[dict]:
    registry = _load_registry()
    docs = [{k: entry[k] for k in _PUBLIC_FIELDS} for entry in registry.values()]
    return sorted(docs, key=lambda d: d["uploaded_at"], reverse=True)


def delete_document(doc_id: str) -> bool:
    with _lock:
        registry = _load_registry()
        entry = registry.pop(doc_id, None)
        if entry is None:
            return False
        _save_registry(registry)

    try:
        get_index().delete_nodes(entry.get("node_ids", []))
    except Exception:
        # Chunks already gone / collection missing — the registry is the source of truth.
        pass

    for stale in get_settings().uploads_dir.glob(f"{doc_id}__*"):
        stale.unlink(missing_ok=True)
    return True
