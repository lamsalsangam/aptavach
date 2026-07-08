import { useEffect, useState } from 'react'
import type { ComponentProps } from 'react'
import { Dialog } from 'radix-ui'
import { Menu } from 'lucide-react'

import { AppSidebar } from '@/components/app-sidebar'
import { BrandMark } from '@/components/brand'
import { ChatPanel } from '@/components/chat/chat-panel'
import { HelpDialog } from '@/components/help-dialog'
import { SidebarRail } from '@/components/sidebar/sidebar-rail'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useChats } from '@/hooks/useChats'
import { useDocuments } from '@/hooks/useDocuments'
import { useProjects } from '@/hooks/useProjects'

const COLLAPSE_KEY = 'aptavach:sidebar-collapsed'

type SegmenterLike = { segment: (input: string) => Iterable<{ segment: string }> }
type SegmenterCtor = new (locales?: string, options?: { granularity: 'grapheme' }) => SegmenterLike

// Split into visual units — keeps Devanagari conjuncts (e.g. प्त) intact, unlike a naive split.
function splitGraphemes(text: string): string[] {
  const Segmenter = (Intl as { Segmenter?: SegmenterCtor }).Segmenter
  if (Segmenter) {
    return Array.from(new Segmenter(undefined, { granularity: 'grapheme' }).segment(text), (p) => p.segment)
  }
  return Array.from(text)
}

function App() {
  const projects = useProjects()
  const documents = useDocuments(projects.currentProjectId)
  const chats = useChats(projects.currentProjectId)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === '1')

  useEffect(() => {
    document.title = projects.currentProject
      ? `${projects.currentProject.name} · Aptavach`
      : 'Aptavach'
  }, [projects.currentProject])

  useEffect(() => {
    localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0')
  }, [collapsed])

  async function handleUpload(file: File) {
    const projectId = projects.currentProjectId
    try {
      await documents.upload(file)
      if (projectId) projects.adjustDocumentCount(projectId, 1)
    } catch {
      // Surfaced via documents.error.
    }
  }

  function handleRemoveDoc(docId: string) {
    const projectId = projects.currentProjectId
    documents.remove(docId)
    if (projectId) projects.adjustDocumentCount(projectId, -1)
  }

  function closeMobileNav() {
    setMobileNavOpen(false)
  }

  if (projects.isLoading) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-2 bg-background text-foreground">
        {/* Sanskrit: wave left → right */}
        <h1 className="font-serif text-3xl font-medium tracking-tight">
          {splitGraphemes('आप्तवच').map((grapheme, index) => (
            <span
              key={index}
              className="inline-block"
              style={{ animation: 'aptavach-wave 1.4s ease-in-out infinite', animationDelay: `${index * 110}ms` }}
            >
              {grapheme}
            </span>
          ))}
        </h1>
        {/* English: wave right → left */}
        <p className="text-[11px] font-medium tracking-[0.25em] text-muted-foreground uppercase">
          {'Aptavach'.split('').map((letter, index, arr) => (
            <span
              key={index}
              className="inline-block"
              style={{ animation: 'aptavach-wave 1.4s ease-in-out infinite', animationDelay: `${(arr.length - 1 - index) * 110}ms` }}
            >
              {letter}
            </span>
          ))}
        </p>
      </div>
    )
  }

  // Shared sidebar props; navigation also closes the mobile drawer (a no-op on desktop).
  const sidebarProps: ComponentProps<typeof AppSidebar> = {
    projects: projects.projects,
    currentProjectId: projects.currentProjectId,
    onSelectProject: (id) => {
      projects.selectProject(id)
      closeMobileNav()
    },
    onCreateProject: projects.create,
    onRenameProject: projects.rename,
    onDeleteProject: projects.remove,
    chats: chats.chats,
    currentChatId: chats.currentChatId,
    onNewChat: () => {
      chats.newChat()
      closeMobileNav()
    },
    onSelectChat: (id) => {
      chats.selectChat(id)
      closeMobileNav()
    },
    onDeleteChat: chats.deleteChat,
    documents: documents.documents,
    docsLoading: documents.isLoading,
    docsUploading: documents.isUploading,
    docsError: documents.error,
    onUpload: handleUpload,
    onRemoveDoc: handleRemoveDoc,
  }

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background text-foreground">
      {/* Desktop rail — collapsible to an icon strip */}
      <aside
        className={cn(
          'hidden shrink-0 flex-col border-r border-border bg-sidebar transition-[width] duration-200 ease-in-out md:flex',
          collapsed ? 'w-14' : 'w-72',
        )}
      >
        {collapsed ? (
          <SidebarRail
            projects={projects.projects}
            currentProjectId={projects.currentProjectId}
            onExpand={() => setCollapsed(false)}
            onSelectProject={projects.selectProject}
            onNewChat={chats.newChat}
          />
        ) : (
          <AppSidebar {...sidebarProps} onCollapse={() => setCollapsed(true)} />
        )}
      </aside>

      {/* Mobile drawer */}
      <Dialog.Root open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed inset-y-0 left-0 z-50 w-72 border-r border-border bg-sidebar shadow-xl focus:outline-none md:hidden data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:slide-out-to-left-4 data-[state=open]:slide-in-from-left-4 data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
            <Dialog.Title className="sr-only">Navigation</Dialog.Title>
            <Dialog.Description className="sr-only">Projects, chats, and sources</Dialog.Description>
            <AppSidebar {...sidebarProps} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between px-4">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open menu"
            >
              <Menu />
            </Button>
            <div className="md:hidden">
              <BrandMark />
            </div>
            <div className="hidden min-w-0 truncate text-sm text-muted-foreground md:block">
              {projects.currentProject?.name}
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            <HelpDialog />
            <ThemeToggle />
          </div>
        </header>
        <div className="min-h-0 flex-1">
          <ChatPanel
            messages={chats.currentChat?.messages ?? []}
            isStreaming={chats.isStreaming}
            error={chats.error}
            hasProject={projects.currentProjectId !== null}
            hasDocuments={documents.documents.length > 0}
            isUploading={documents.isUploading}
            onSend={chats.sendMessage}
            onStop={chats.stop}
            onUpload={handleUpload}
          />
        </div>
      </main>
    </div>
  )
}

export default App
