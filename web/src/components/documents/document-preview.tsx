import { useEffect, useState } from 'react'
import { Dialog } from 'radix-ui'
import { ExternalLink, Loader2, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { documentFileUrl, getDocumentContent } from '@/lib/api'
import type { DocumentInfo } from '@/lib/api'

export function DocumentPreview({ doc, onClose }: { doc: DocumentInfo | null; onClose: () => void }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!doc) return
    setText('')
    setError(null)
    setLoading(true)
    const controller = new AbortController()
    getDocumentContent(doc.doc_id, controller.signal)
      .then((res) => setText(res.text))
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Failed to load document.')
        }
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [doc])

  return (
    <Dialog.Root
      open={doc !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 flex max-h-[85vh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-xl focus:outline-none data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
            <Dialog.Title className="min-w-0 flex-1 truncate font-medium">{doc?.filename}</Dialog.Title>
            <div className="flex items-center gap-1">
              {doc && (
                <Button variant="outline" size="sm" className="gap-1.5" asChild>
                  <a href={documentFileUrl(doc.doc_id)} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-3.5" />
                    Open original
                  </a>
                </Button>
              )}
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Close">
                  <X />
                </Button>
              </Dialog.Close>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Loading…
              </div>
            ) : error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : (
              <pre className="font-sans text-sm leading-relaxed whitespace-pre-wrap wrap-break-word text-foreground">
                {text || 'No extractable text found in this document.'}
              </pre>
            )}
          </div>

          <div className="border-t border-border px-5 py-2 text-[11px] text-muted-foreground">
            This is the text Aptavach extracted and searches{doc ? ` — ${doc.num_chunks} chunks` : ''}.
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
