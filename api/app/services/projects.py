"""Projects: named workspaces that each own a set of documents. Persisted as JSON in storage/;
cascading document deletion is coordinated by the route, not here, to keep services decoupled."""
import json
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path

from ..config import get_settings

_lock = threading.Lock()


def _path() -> Path:
    return get_settings().storage_dir / "projects.json"


def _load() -> dict:
    path = _path()
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return {}


def _save(data: dict) -> None:
    _path().write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def create_project(name: str) -> dict:
    project_id = uuid.uuid4().hex
    entry = {
        "id": project_id,
        "name": name.strip(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    with _lock:
        data = _load()
        data[project_id] = entry
        _save(data)
    return entry


def list_projects() -> list[dict]:
    return sorted(_load().values(), key=lambda p: p["created_at"])


def get_project(project_id: str) -> dict | None:
    return _load().get(project_id)


def rename_project(project_id: str, name: str) -> dict | None:
    with _lock:
        data = _load()
        if project_id not in data:
            return None
        data[project_id]["name"] = name.strip()
        _save(data)
        return data[project_id]


def delete_project(project_id: str) -> bool:
    with _lock:
        data = _load()
        if data.pop(project_id, None) is None:
            return False
        _save(data)
    return True
