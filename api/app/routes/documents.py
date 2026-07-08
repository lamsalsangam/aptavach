from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from starlette.concurrency import run_in_threadpool

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


@router.get("/documents/{doc_id}/file")
def download_document(doc_id: str) -> FileResponse:
    entry = document_service.get_document(doc_id)
    path = document_service.get_document_path(doc_id)
    if entry is None or path is None:
        raise HTTPException(status_code=404, detail="Document not found")
    # inline so PDFs/text open in the browser tab (other types download).
    return FileResponse(path, filename=entry["filename"], content_disposition_type="inline")


@router.get("/documents/{doc_id}/content")
async def document_content(doc_id: str) -> dict:
    entry = document_service.get_document(doc_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="Document not found")
    text = await run_in_threadpool(document_service.get_document_text, doc_id)
    return {"doc_id": doc_id, "filename": entry["filename"], "text": text or ""}
