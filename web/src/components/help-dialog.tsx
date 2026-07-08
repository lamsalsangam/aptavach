import { Dialog } from 'radix-ui'
import { CircleHelp, FileUp, FolderPlus, Keyboard, Languages, Layers, Quote, ShieldCheck, X } from 'lucide-react'

import { Button } from '@/components/ui/button'

const steps = [
  {
    icon: FolderPlus,
    title: 'Create a project',
    body: 'A project is a workspace with its own documents. Use the + next to “Projects” to add one; double-click its name to rename.',
  },
  {
    icon: FileUp,
    title: 'Add sources',
    body: 'Upload PDF, DOCX, TXT, or Markdown files to the project — drop them in or use the Sources panel. Aptavach splits and indexes them.',
  },
  {
    icon: Quote,
    title: 'Ask, with citations',
    body: 'Every chat in the project is answered strictly from its sources — and shows the exact passages it used (filename, page, match).',
  },
]

const notes = [
  {
    icon: Layers,
    text: 'Projects keep things separate — each has its own documents and chats. Switch between them anytime from the sidebar.',
  },
  {
    icon: ShieldCheck,
    text: 'Runs fully on your machine (Ollama + Qdrant). Your documents never leave your computer.',
  },
  {
    icon: Languages,
    text: 'Understands many languages, so your sources and questions can be in different ones.',
  },
  {
    icon: Keyboard,
    text: 'Enter to send · Shift+Enter for a new line · Stop to interrupt a reply.',
  },
]

export function HelpDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button variant="ghost" size="icon" aria-label="Help" title="How to use Aptavach">
          <CircleHelp />
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 flex max-h-[85vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-xl focus:outline-none data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
            <div>
              <Dialog.Title className="font-serif text-xl font-medium tracking-tight">How Aptavach works</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                It answers only from documents you provide — and cites every claim.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Close">
                <X />
              </Button>
            </Dialog.Close>
          </div>

          <div className="min-h-0 space-y-6 overflow-y-auto px-6 py-5">
            <ol className="space-y-4">
              {steps.map((step, index) => {
                const Icon = step.icon
                return (
                  <li key={step.title} className="flex gap-3">
                    <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                      <Icon className="size-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">
                        <span className="text-muted-foreground">{index + 1}.</span> {step.title}
                      </div>
                      <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                    </div>
                  </li>
                )
              })}
            </ol>

            <div className="space-y-2.5 rounded-xl bg-muted/50 p-4">
              {notes.map((note) => {
                const Icon = note.icon
                return (
                  <div key={note.text} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <Icon className="mt-0.5 size-4 shrink-0" />
                    <span>{note.text}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="border-t border-border px-6 py-3">
            <p className="text-xs text-muted-foreground italic">
              <span className="font-serif not-italic">आप्तवच</span> · āpta-vacana — “the trustworthy word of a reliable
              authority.” Because an echo is only as clear as its source.
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
