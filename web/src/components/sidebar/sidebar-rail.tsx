import { Folder, PanelLeftOpen, Plus } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { Project } from '@/lib/api'

interface SidebarRailProps {
  projects: Project[]
  currentProjectId: string | null
  onExpand: () => void
  onSelectProject: (id: string) => void
  onNewChat: () => void
}

const RAIL_BTN =
  'grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'

// The collapsed sidebar: icons only. Projects show as initials; hover for the full name.
export function SidebarRail({ projects, currentProjectId, onExpand, onSelectProject, onNewChat }: SidebarRailProps) {
  return (
    <div className="flex h-full w-14 flex-col items-center gap-1 py-3">
      <button type="button" onClick={onExpand} className={RAIL_BTN} aria-label="Expand sidebar" title="Expand sidebar">
        <PanelLeftOpen className="size-4" />
      </button>

      <button type="button" onClick={onNewChat} className={RAIL_BTN} aria-label="New chat" title="New chat">
        <Plus className="size-4" />
      </button>

      <div className="my-1 h-px w-6 bg-border" />

      <div className="flex min-h-0 flex-1 flex-col items-center gap-1 overflow-y-auto">
        {projects.map((project) => (
          <button
            key={project.id}
            type="button"
            onClick={() => onSelectProject(project.id)}
            title={project.name}
            aria-label={project.name}
            className={cn(
              'grid size-9 shrink-0 place-items-center rounded-lg text-sm font-medium transition-colors',
              project.id === currentProjectId
                ? 'bg-muted text-foreground ring-1 ring-border'
                : 'text-muted-foreground hover:bg-muted/60',
            )}
          >
            {project.name.trim().charAt(0).toUpperCase() || <Folder className="size-4" />}
          </button>
        ))}
      </div>
    </div>
  )
}
