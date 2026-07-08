// The only module that talks to the backend. UI components and hooks call these functions and
// never touch `fetch` directly — that's what makes the frontend framework/transport-agnostic.

import { API_BASE } from './config'
import type { ChatEvent, Citation, DocumentInfo, IngestResponse } from './types'

async function toJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText)
    throw new Error(detail || `Request failed (${res.status})`)
  }
  return res.json() as Promise<T>
}

export function listDocuments(signal?: AbortSignal): Promise<DocumentInfo[]> {
  return fetch(`${API_BASE}/documents`, { signal }).then((r) => toJson<DocumentInfo[]>(r))
}

export function uploadDocument(file: File): Promise<IngestResponse> {
  const body = new FormData()
  body.append('file', file)
  return fetch(`${API_BASE}/documents`, { method: 'POST', body }).then((r) =>
    toJson<IngestResponse>(r),
  )
}

export function deleteDocument(docId: string): Promise<{ deleted: string }> {
  return fetch(`${API_BASE}/documents/${docId}`, { method: 'DELETE' }).then((r) =>
    toJson<{ deleted: string }>(r),
  )
}

export interface ChatHandlers {
  onToken?: (text: string) => void
  onSources?: (sources: Citation[]) => void
  onDone?: () => void
  signal?: AbortSignal
}

// Streams an answer token-by-token, then the citations. Parses the backend's `data: {json}`
// SSE frames off a plain fetch stream (EventSource can't POST).
export async function streamChat(
  message: string,
  handlers: ChatHandlers = {},
  topK?: number,
): Promise<void> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, top_k: topK ?? null }),
    signal: handlers.signal,
  })

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => res.statusText)
    throw new Error(detail || `Chat failed (${res.status})`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    let sep = buffer.indexOf('\n\n')
    while (sep !== -1) {
      const frame = buffer.slice(0, sep)
      buffer = buffer.slice(sep + 2)

      const dataLine = frame.split('\n').find((l) => l.startsWith('data:'))
      if (dataLine) {
        const json = dataLine.slice(5).trim()
        if (json) dispatch(JSON.parse(json) as ChatEvent, handlers)
      }
      sep = buffer.indexOf('\n\n')
    }
  }
}

function dispatch(event: ChatEvent, handlers: ChatHandlers): void {
  if (event.type === 'token') handlers.onToken?.(event.text)
  else if (event.type === 'sources') handlers.onSources?.(event.sources)
  else if (event.type === 'done') handlers.onDone?.()
}
