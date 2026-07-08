// Mirrors the backend's pydantic schemas (api/app/schemas.py). This typed contract is what
// keeps the UI and the API honest with each other.

export interface DocumentInfo {
  doc_id: string
  filename: string
  num_chunks: number
  size: number
  uploaded_at: string
}

export interface IngestResponse extends DocumentInfo {
  status: string
}

export interface Citation {
  id: number
  source: string
  page?: string | null
  score?: number | null
  text: string
}

// Server-sent events streamed from POST /api/chat.
export type ChatEvent =
  | { type: 'token'; text: string }
  | { type: 'sources'; sources: Citation[] }
  | { type: 'done' }
