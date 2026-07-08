import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Loader2, UploadCloud } from 'lucide-react'

import { EmptyState } from '@/components/brand'
import { cn } from '@/lib/utils'
import type { ChatMessage } from '@/lib/types'
import { ChatInput } from './chat-input'
import { MessageItem } from './message'

interface ChatPanelProps {
  messages: ChatMessage[]
  isStreaming: boolean
  error: string | null
  hasProject: boolean
  hasDocuments: boolean
  isUploading: boolean
  onSend: (text: string) => void
  onStop: () => void
  onUpload: (file: File) => void
}

export function ChatPanel({
  messages,
  isStreaming,
  error,
  hasProject,
  hasDocuments,
  isUploading,
  onSend,
  onStop,
  onUpload,
}: ChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // No project selected → no composer, just a prompt to pick or create one.
  if (!hasProject) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center">
        <div className="max-w-sm">
          <h2 className="font-serif text-xl font-medium">No project selected</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Create or pick a project from the sidebar, then start a chat.
          </p>
        </div>
      </div>
    )
  }

  // Project with no sources → ask for a document before any chatting is possible.
  if (!hasDocuments) {
    return <UploadFirst onUpload={onUpload} isUploading={isUploading} />
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="flex h-full items-center justify-center py-10">
            <EmptyState hasDocuments onExampleClick={onSend} />
          </div>
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-7 px-4 py-8">
            {messages.map((message) => (
              <MessageItem key={message.id} message={message} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="mx-auto w-full max-w-3xl px-4 pb-4">
        {error && (
          <div className="mb-2 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <AlertTriangle className="size-3.5 shrink-0" />
            {error}
          </div>
        )}
        <ChatInput onSend={onSend} onStop={onStop} isStreaming={isStreaming} />
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Aptavach answers only from this project's sources and shows them. Enter to send · Shift+Enter for a new line.
        </p>
      </div>
    </div>
  )
}

function UploadFirst({ onUpload, isUploading }: { onUpload: (file: File) => void; isUploading: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  function handleFiles(files: FileList | null) {
    if (files && files.length > 0) onUpload(files[0])
  }

  return (
    <div className="flex h-full items-center justify-center p-6">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          handleFiles(e.dataTransfer.files)
        }}
        className={cn(
          'flex w-full max-w-md cursor-pointer flex-col items-center gap-4 rounded-2xl border border-dashed border-border px-8 py-14 text-center outline-none transition-colors hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/40',
          dragOver && 'border-foreground/40 bg-muted/50',
        )}
      >
        <div className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
          {isUploading ? <Loader2 className="size-5 animate-spin" /> : <UploadCloud className="size-5" />}
        </div>
        <div>
          <h2 className="font-serif text-xl font-medium">{isUploading ? 'Indexing…' : 'Add a source to begin'}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Upload a PDF, DOCX, TXT, or Markdown file — drop it here or click. Aptavach answers strictly from your
            sources, and cites them.
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          hidden
          accept=".pdf,.docx,.txt,.md,.markdown"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
    </div>
  )
}
