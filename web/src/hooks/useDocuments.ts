// Document library state: loads the indexed docs on mount, and exposes upload/delete with
// optimistic updates so the sidebar feels instant.
import { useEffect, useState } from 'react'

import { deleteDocument, listDocuments, uploadDocument } from '@/lib/api'
import type { DocumentInfo } from '@/lib/api'

export function useDocuments() {
  const [documents, setDocuments] = useState<DocumentInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    setIsLoading(true)
    try {
      setDocuments(await listDocuments())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  async function upload(file: File) {
    setError(null)
    setIsUploading(true)
    try {
      const info = await uploadDocument(file)
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

  return { documents, isLoading, isUploading, error, refresh, upload, remove }
}
