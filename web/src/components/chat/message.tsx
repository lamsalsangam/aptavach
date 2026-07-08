import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

import { Markdown } from '@/components/markdown'
import type { Citation } from '@/lib/api'
import type { ChatMessage } from '@/lib/types'

export function MessageItem({ message }: { message: ChatMessage }) {
  if (message.role === 'user') {
    return (
      <div className="group/msg flex flex-col items-end gap-1">
        <div className="max-w-[80%] rounded-2xl bg-muted px-4 py-2.5 text-[15px] leading-7 wrap-break-word whitespace-pre-wrap">
          {message.content}
        </div>
        <div className="opacity-0 transition-opacity group-hover/msg:opacity-100 max-md:opacity-100">
          <CopyButton text={message.content} />
        </div>
      </div>
    )
  }

  const showThinking = message.pending && !message.content

  return (
    <div className="group/msg flex flex-col gap-3">
      {showThinking ? <ThinkingDots /> : <Markdown>{message.content}</Markdown>}

      {!showThinking && !message.pending && (
        <div className="opacity-0 transition-opacity group-hover/msg:opacity-100 max-md:opacity-100">
          <CopyButton text={message.content} />
        </div>
      )}

      {message.citations && message.citations.length > 0 && <Citations citations={message.citations} />}
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard unavailable (e.g. a non-secure context) — ignore.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={copied ? 'Copied' : 'Copy'}
      aria-label="Copy message"
      className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </button>
  )
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="size-1.5 animate-bounce rounded-full bg-muted-foreground/70"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  )
}

function Citations({ citations }: { citations: Citation[] }) {
  return (
    <div className="mt-1 space-y-2">
      <div className="text-xs font-medium text-muted-foreground">Sources</div>
      <div className="grid gap-2 sm:grid-cols-2">
        {citations.map((citation) => (
          <div
            key={citation.id}
            className="rounded-xl border border-border bg-card p-3 transition-colors hover:bg-muted/50"
          >
            <div className="mb-1.5 flex items-center gap-2">
              <span className="grid size-4 shrink-0 place-items-center rounded bg-foreground/5 text-[10px] font-semibold text-muted-foreground">
                {citation.id}
              </span>
              <span className="truncate text-xs font-medium">{citation.source}</span>
              {citation.page && <span className="shrink-0 text-[11px] text-muted-foreground">p.{citation.page}</span>}
              {typeof citation.score === 'number' && (
                <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                  {Math.round(citation.score * 100)}%
                </span>
              )}
            </div>
            <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{citation.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
