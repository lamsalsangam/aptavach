// Identity is carried quietly by a serif wordmark — no heavy emblem, matching a Claude/ChatGPT feel.

export function BrandMark() {
  return (
    <div className="flex items-baseline gap-2 select-none">
      <span className="font-serif text-[17px] font-medium tracking-tight">Aptavach</span>
      <span className="font-serif text-[15px] text-muted-foreground">आप्तवच</span>
    </div>
  )
}

export function EmptyState({
  hasDocuments,
  onExampleClick,
}: {
  hasDocuments: boolean
  onExampleClick: (text: string) => void
}) {
  const examples = ['Summarize the key points', 'What are the main conclusions?']

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 text-center">
      <h1 className="font-serif text-3xl font-medium tracking-tight sm:text-4xl">
        {hasDocuments ? 'Ask your sources' : 'Add a source to begin'}
      </h1>
      <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
        {hasDocuments
          ? 'Aptavach answers only from the documents you’ve added — and every claim shows where it came from.'
          : 'Upload a document from the left, and Aptavach will answer strictly from it — never without a source.'}
      </p>
      <p className="mt-4 text-xs tracking-wide text-muted-foreground/70 italic">
        Because an echo is only as clear as its source.
      </p>

      {hasDocuments && (
        <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
          {examples.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => onExampleClick(example)}
              className="rounded-xl border border-border bg-card px-3.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {example}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
