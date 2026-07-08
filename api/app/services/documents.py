"""Document lifecycle, scoped to a project: ingest an upload, list a project's documents, and
delete (a single doc, or all of a project's). A JSON registry tracks each doc's chunk ids."""
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
_PUBLIC_FIELDS = ("doc_id", "project_id", "filename", "num_chunks", "size", "uploaded_at")


def _registry_path() -> Path:
    return get_settings().storage_dir / "registry.json"


def _load_registry() -> dict:
    path = _registry_path()
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return {}


def _save_registry(registry: dict) -> None:
    _registry_path().write_text(json.dumps(registry, ensure_ascii=False, indent=2), encoding="utf-8")


def _public(entry: dict) -> dict:
    return {key: entry[key] for key in _PUBLIC_FIELDS}


def _remove_nodes_and_file(entry: dict) -> None:
    try:
        get_index().delete_nodes(entry.get("node_ids", []))
    except Exception:
        # Chunks already gone / collection missing — the registry is the source of truth.
        pass
    for stale in get_settings().uploads_dir.glob(f"{entry['doc_id']}__*"):
        stale.unlink(missing_ok=True)


def has_documents(project_id: str) -> bool:
    return any(e.get("project_id") == project_id for e in _load_registry().values())


def count_documents(project_id: str) -> int:
    return sum(1 for e in _load_registry().values() if e.get("project_id") == project_id)


async def ingest_upload(project_id: str, file: UploadFile) -> dict:
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
            node.metadata["project_id"] = project_id
            node.metadata["source"] = safe_name
        get_index().insert_nodes(nodes)
        return [node.node_id for node in nodes]

    node_ids = await run_in_threadpool(_index_file)

    entry = {
        "doc_id": doc_id,
        "project_id": project_id,
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

    return {**_public(entry), "status": "indexed"}


def list_documents(project_id: str) -> list[dict]:
    registry = _load_registry()
    docs = [_public(e) for e in registry.values() if e.get("project_id") == project_id]
    return sorted(docs, key=lambda d: d["uploaded_at"], reverse=True)


def get_document(doc_id: str) -> dict | None:
    return _load_registry().get(doc_id)


def get_document_path(doc_id: str) -> Path | None:
    entry = _load_registry().get(doc_id)
    if entry is None:
        return None
    path = get_settings().uploads_dir / f"{doc_id}__{entry['filename']}"
    return path if path.exists() else None


def get_document_text(doc_id: str) -> str | None:
    """Re-extract the text of a stored document (for preview) using the same reader as ingest."""
    path = get_document_path(doc_id)
    if path is None:
        return None
    documents = SimpleDirectoryReader(input_files=[str(path)]).load_data()
    return "\n\n".join(doc.get_content() for doc in documents)


def delete_document(doc_id: str) -> bool:
    with _lock:
        registry = _load_registry()
        entry = registry.pop(doc_id, None)
        if entry is None:
            return False
        _save_registry(registry)
    _remove_nodes_and_file(entry)
    return True


def delete_documents_for_project(project_id: str) -> None:
    with _lock:
        registry = _load_registry()
        doomed = [doc_id for doc_id, e in registry.items() if e.get("project_id") == project_id]
        entries = [registry.pop(doc_id) for doc_id in doomed]
        _save_registry(registry)
    for entry in entries:
        _remove_nodes_and_file(entry)
