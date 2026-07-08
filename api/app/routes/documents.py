from fastapi import APIRouter, File, HTTPException, UploadFile

from ..schemas import DocumentInfo, IngestResponse
from ..services import documents as document_service
from ..services import projects as project_service

router = APIRouter(tags=["documents"])


@router.post("/projects/{project_id}/documents", response_model=IngestResponse)
async def upload_document(project_id: str, file: UploadFile = File(...)) -> dict:
    if project_service.get_project(project_id) is None:
        raise HTTPException(status_code=404, detail="Project not found")
    try:
        return await document_service.ingest_upload(project_id, file)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {exc}") from exc


@router.get("/projects/{project_id}/documents", response_model=list[DocumentInfo])
def list_documents(project_id: str) -> list[dict]:
    return document_service.list_documents(project_id)


@router.delete("/documents/{doc_id}")
def delete_document(doc_id: str) -> dict:
    if not document_service.delete_document(doc_id):
        raise HTTPException(status_code=404, detail="Document not found")
    return {"deleted": doc_id}
