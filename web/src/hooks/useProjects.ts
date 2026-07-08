// Projects live server-side. This hook loads them, tracks the current selection (remembered in
// localStorage), and exposes create/rename/delete.
import { useEffect, useRef, useState } from 'react'

import { createProject, deleteProject, listProjects, renameProject } from '@/lib/api'
import type { Project } from '@/lib/api'

const LAST_PROJECT_KEY = 'aptavach:last-project'

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    void (async () => {
      try {
        let list = await listProjects()
        // Land the user straight in a workspace — no forced setup screen.
        if (list.length === 0) list = [await createProject('My Project')]
        setProjects(list)
        const last = localStorage.getItem(LAST_PROJECT_KEY)
        setCurrentProjectId(list.find((p) => p.id === last)?.id ?? list[0]?.id ?? null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load projects.')
      } finally {
        setIsLoading(false)
      }
    })()
  }, [])

  function selectProject(id: string) {
    setCurrentProjectId(id)
    localStorage.setItem(LAST_PROJECT_KEY, id)
  }

  async function create(name: string) {
    const project = await createProject(name)
    setProjects((prev) => [...prev, project])
    selectProject(project.id)
    return project
  }

  async function rename(id: string, name: string) {
    const updated = await renameProject(id, name)
    setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)))
  }

  async function remove(id: string) {
    await deleteProject(id)
    const remaining = projects.filter((p) => p.id !== id)
    setProjects(remaining)
    if (currentProjectId === id) {
      const fallback = remaining[0]?.id ?? null
      setCurrentProjectId(fallback)
      if (fallback) localStorage.setItem(LAST_PROJECT_KEY, fallback)
      else localStorage.removeItem(LAST_PROJECT_KEY)
    }
  }

  function adjustDocumentCount(id: string, delta: number) {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, document_count: Math.max(0, p.document_count + delta) } : p)),
    )
  }

  const currentProject = projects.find((p) => p.id === currentProjectId) ?? null

  return {
    projects,
    currentProject,
    currentProjectId,
    isLoading,
    error,
    selectProject,
    create,
    rename,
    remove,
    adjustDocumentCount,
  }
}
