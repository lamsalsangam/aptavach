import { useState } from 'react'
import { DropdownMenu } from 'radix-ui'
import { Folder, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Project } from '@/lib/api'

interface ProjectListProps {
  projects: Project[]
  currentProjectId: string | null
  onSelect: (id: string) => void
  onCreate: (name: string) => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
}

const ITEM = 'flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm outline-none data-highlighted:bg-muted'
const EDIT_ROW = 'flex items-center gap-2 rounded-lg bg-muted px-2 py-1.5'
const EDIT_INPUT = 'min-w-0 flex-1 bg-transparent text-sm outline-none'

export function ProjectList({ projects, currentProjectId, onSelect, onCreate, onRename, onDelete }: ProjectListProps) {
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')

  function startEdit(project: Project) {
    setEditingId(project.id)
    setEditingValue(project.name)
  }

  function commitEdit() {
    if (editingId) {
      const value = editingValue.trim()
      const project = projects.find((p) => p.id === editingId)
      if (value && project && value !== project.name) onRename(editingId, value)
    }
    setEditingId(null)
  }

  function submitCreate() {
    const value = newName.trim()
    if (value) onCreate(value)
    setCreating(false)
    setNewName('')
  }

  function confirmDelete(project: Project) {
    if (window.confirm(`Delete “${project.name}” and all of its sources? This cannot be undone.`)) {
      onDelete(project.id)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between px-4 pt-2 pb-1">
        <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Projects</span>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => {
            setNewName('')
            setCreating(true)
          }}
          aria-label="New project"
          title="New project"
        >
          <Plus />
        </Button>
      </div>

      <ul className="space-y-0.5 px-2">
        {creating && (
          <li>
            <div className={EDIT_ROW}>
              <Folder className="size-4 shrink-0 text-muted-foreground" />
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitCreate()
                  else if (e.key === 'Escape') {
                    setCreating(false)
                    setNewName('')
                  }
                }}
                onBlur={submitCreate}
                placeholder="Project name…"
                className={EDIT_INPUT}
              />
            </div>
          </li>
        )}

        {projects.map((project) => (
          <li key={project.id}>
            {editingId === project.id ? (
              <div className={EDIT_ROW}>
                <Folder className="size-4 shrink-0 text-muted-foreground" />
                <input
                  autoFocus
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitEdit()
                    else if (e.key === 'Escape') setEditingId(null)
                  }}
                  onBlur={commitEdit}
                  className={EDIT_INPUT}
                />
              </div>
            ) : (
              <div
                className={cn(
                  'group flex items-center gap-1 rounded-lg pr-1 text-sm transition-colors',
                  project.id === currentProjectId ? 'bg-muted' : 'hover:bg-muted/60',
                )}
              >
                <button
                  type="button"
                  onClick={() => onSelect(project.id)}
                  onDoubleClick={() => startEdit(project)}
                  title="Double-click to rename"
                  className="flex min-w-0 flex-1 items-center gap-2 py-1.5 pl-2 text-left"
                >
                  <Folder className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">{project.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{project.document_count}</span>
                </button>

                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="shrink-0 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
                      aria-label="Project options"
                    >
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      align="end"
                      sideOffset={4}
                      className="z-50 min-w-40 rounded-xl border border-border bg-popover p-1 shadow-lg data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
                    >
                      <DropdownMenu.Item onSelect={() => setTimeout(() => startEdit(project), 0)} className={ITEM}>
                        <Pencil className="size-4" /> Rename
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        onSelect={() => confirmDelete(project)}
                        className={cn(ITEM, 'text-destructive data-highlighted:bg-destructive/10')}
                      >
                        <Trash2 className="size-4" /> Delete
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
