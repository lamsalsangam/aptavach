import type { Citation } from '@/lib/api'
import type { ChatMessage } from '@/lib/types'

export function MessageItem({ message }: { message: ChatMessage }) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl bg-muted px-4 py-2.5 text-[15px] leading-7 wrap-break-word whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    )
  }

  const showThinking = message.pending && !message.content

  return (
    <div className="flex flex-col gap-3">
      {showThinking ? (
        <ThinkingDots />
      ) : (
        <div className="text-[15px] leading-7 wrap-break-word whitespace-pre-wrap text-foreground">
          {message.content}
          {message.pending && (
            <span className="ml-0.5 inline-block h-[1.1em] w-0.75 translate-y-0.5 animate-pulse rounded-full bg-foreground/70 align-middle" />
          )}
        </div>
      )}

      {message.citations && message.citations.length > 0 && <Citations citations={message.citations} />}
    </div>
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
