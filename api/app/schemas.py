"""API request/response contracts — the typed boundary the frontend depends on."""
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, description="The user's question.")
    top_k: int | None = Field(default=None, ge=1, le=20)


class Citation(BaseModel):
    id: int
    source: str
    page: str | None = None
    score: float | None = None
    text: str


class DocumentInfo(BaseModel):
    doc_id: str
    filename: str
    num_chunks: int
    size: int
    uploaded_at: str


class IngestResponse(DocumentInfo):
    status: str = "indexed"
