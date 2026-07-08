from fastapi import APIRouter, HTTPException

from ..schemas import Project, ProjectCreate, ProjectUpdate
from ..services import documents as document_service
from ..services import projects as project_service

router = APIRouter(prefix="/projects", tags=["projects"])


def _with_count(project: dict) -> dict:
    return {**project, "document_count": document_service.count_documents(project["id"])}


@router.get("", response_model=list[Project])
def list_projects() -> list[dict]:
    return [_with_count(project) for project in project_service.list_projects()]


@router.post("", response_model=Project, status_code=201)
def create_project(body: ProjectCreate) -> dict:
    return _with_count(project_service.create_project(body.name))


@router.patch("/{project_id}", response_model=Project)
def rename_project(project_id: str, body: ProjectUpdate) -> dict:
    updated = project_service.rename_project(project_id, body.name)
    if updated is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return _with_count(updated)


@router.delete("/{project_id}")
def delete_project(project_id: str) -> dict:
    if project_service.get_project(project_id) is None:
        raise HTTPException(status_code=404, detail="Project not found")
    # Cascade: remove the project's documents (and their chunks) first.
    document_service.delete_documents_for_project(project_id)
    project_service.delete_project(project_id)
    return {"deleted": project_id}
