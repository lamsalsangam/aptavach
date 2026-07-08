// A single project's documents (server-side). Loads on project change; optimistic upload/delete.
import { useEffect, useState } from 'react'

import { deleteDocument, listDocuments, uploadDocument } from '@/lib/api'
import type { DocumentInfo } from '@/lib/api'

export function useDocuments(projectId: string | null) {
  const [documents, setDocuments] = useState<DocumentInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!projectId) {
      setDocuments([])
      return
    }
    const controller = new AbortController()
    setIsLoading(true)
    listDocuments(projectId, controller.signal)
      .then(setDocuments)
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Failed to load documents.')
        }
      })
      .finally(() => setIsLoading(false))
    return () => controller.abort()
  }, [projectId])

  async function upload(file: File) {
    if (!projectId) return
    setError(null)
    setIsUploading(true)
    try {
      const info = await uploadDocument(projectId, file)
      setDocuments((prev) => [info, ...prev])
      return info
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.')
      throw err
    } finally {
      setIsUploading(false)
    }
  }

  async function remove(docId: string) {
    const previous = documents
    setDocuments((docs) => docs.filter((doc) => doc.doc_id !== docId))
    try {
      await deleteDocument(docId)
    } catch (err) {
      setDocuments(previous) // rollback on failure
      setError(err instanceof Error ? err.message : 'Delete failed.')
    }
  }

  return { documents, isLoading, isUploading, error, upload, remove }
}
