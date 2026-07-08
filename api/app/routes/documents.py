from fastapi import APIRouter, File, HTTPException, UploadFile

from ..schemas import DocumentInfo, IngestResponse
from ..services import documents as document_service

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("", response_model=IngestResponse)
async def upload_document(file: UploadFile = File(...)) -> dict:
    try:
        return await document_service.ingest_upload(file)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {exc}") from exc


@router.get("", response_model=list[DocumentInfo])
async def list_documents() -> list[dict]:
    return document_service.list_documents()


@router.delete("/{doc_id}")
async def delete_document(doc_id: str) -> dict:
    if not document_service.delete_document(doc_id):
        raise HTTPException(status_code=404, detail="Document not found")
    return {"deleted": doc_id}
