import { PanelLeftClose, Plus } from 'lucide-react'

import { BrandMark } from '@/components/brand'
import { Sources } from '@/components/documents/sources'
import { ChatList } from '@/components/sidebar/chat-list'
import { ProjectList } from '@/components/sidebar/project-list'
import { Button } from '@/components/ui/button'
import type { DocumentInfo, Project } from '@/lib/api'
import type { Chat } from '@/lib/types'

interface AppSidebarProps {
  projects: Project[]
  currentProjectId: string | null
  onSelectProject: (id: string) => void
  onCreateProject: (name: string) => void
  onRenameProject: (id: string, name: string) => void
  onDeleteProject: (id: string) => void

  chats: Chat[]
  currentChatId: string | null
  onNewChat: () => void
  onSelectChat: (id: string) => void
  onDeleteChat: (id: string) => void

  documents: DocumentInfo[]
  docsLoading: boolean
  docsUploading: boolean
  docsError: string | null
  onUpload: (file: File) => void
  onRemoveDoc: (id: string) => void

  onCollapse?: () => void
}

export function AppSidebar(props: AppSidebarProps) {
  const hasProject = props.currentProjectId !== null

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center justify-between px-4">
        <BrandMark />
        {props.onCollapse && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={props.onCollapse}
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
          >
            <PanelLeftClose />
          </Button>
        )}
      </div>

      <div className="px-2">
        <button
          type="button"
          disabled={!hasProject}
          onClick={props.onNewChat}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
        >
          <Plus className="size-4 text-muted-foreground" />
          New chat
        </button>
      </div>

      <div className="mt-1 flex-1 overflow-y-auto">
        <ProjectList
          projects={props.projects}
          currentProjectId={props.currentProjectId}
          onSelect={props.onSelectProject}
          onCreate={props.onCreateProject}
          onRename={props.onRenameProject}
          onDelete={props.onDeleteProject}
        />

        <div className="px-4 pt-4 pb-1">
          <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Chats</span>
        </div>
        <ChatList
          chats={props.chats}
          currentChatId={props.currentChatId}
          onSelect={props.onSelectChat}
          onDelete={props.onDeleteChat}
        />
      </div>

      <Sources
        documents={props.documents}
        isLoading={props.docsLoading}
        isUploading={props.docsUploading}
        error={props.docsError}
        disabled={!hasProject}
        onUpload={props.onUpload}
        onRemove={props.onRemoveDoc}
      />
    </div>
  )
}
