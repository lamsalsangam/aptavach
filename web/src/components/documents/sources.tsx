import { useRef, useState } from 'react'
import { FileText, Loader2, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { DocumentInfo } from '@/lib/api'
import { DocumentPreview } from './document-preview'

interface SourcesProps {
  documents: DocumentInfo[]
  isLoading: boolean
  isUploading: boolean
  error: string | null
  disabled?: boolean
  onUpload: (file: File) => void
  onRemove: (docId: string) => void
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function Sources({ documents, isLoading, isUploading, error, disabled, onUpload, onRemove }: SourcesProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<DocumentInfo | null>(null)

  function handleFiles(files: FileList | null) {
    if (files && files.length > 0) onUpload(files[0])
  }

  return (
    <div
      onDragOver={(e) => {
        if (!disabled) {
          e.preventDefault()
          setDragOver(true)
        }
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        if (!disabled) handleFiles(e.dataTransfer.files)
      }}
      className={cn('flex flex-col border-t border-border transition-colors', dragOver && 'bg-muted/50')}
    >
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          Sources {documents.length > 0 && <span className="text-muted-foreground/60">· {documents.length}</span>}
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          disabled={disabled || isUploading}
          onClick={() => inputRef.current?.click()}
          aria-label="Add a source"
          title="Add a source"
        >
          {isUploading ? <Loader2 className="animate-spin" /> : <Plus />}
        </Button>
        <input
          ref={inputRef}
          type="file"
          hidden
          accept=".pdf,.docx,.txt,.md,.markdown"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      <div className="max-h-52 overflow-y-auto px-2 pb-2">
        {disabled ? (
          <p className="px-2 py-1 text-xs text-muted-foreground">Select a project to add sources.</p>
        ) : isLoading ? (
          <p className="px-2 py-1 text-xs text-muted-foreground">Loading…</p>
        ) : documents.length === 0 ? (
          <p className="px-2 py-1 text-xs text-muted-foreground">No sources yet — add one to ground this project.</p>
        ) : (
          <ul className="space-y-0.5">
            {documents.map((doc) => (
              <li key={doc.doc_id} className="group flex items-center gap-1 rounded-lg pr-1 transition-colors hover:bg-muted">
                <button
                  type="button"
                  onClick={() => setPreviewDoc(doc)}
                  title="Preview / open"
                  className="flex min-w-0 flex-1 items-center gap-2.5 py-1.5 pl-2 text-left"
                >
                  <FileText className="size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{doc.filename}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {doc.num_chunks} chunks · {formatBytes(doc.size)}
                    </p>
                  </div>
                </button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => onRemove(doc.doc_id)}
                  aria-label={`Remove ${doc.filename}`}
                  title="Remove"
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        )}
        {error && <p className="px-2 py-1 text-xs text-destructive">{error}</p>}
      </div>

      <DocumentPreview doc={previewDoc} onClose={() => setPreviewDoc(null)} />
    </div>
  )
}
