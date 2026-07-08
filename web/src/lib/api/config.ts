// The single source of truth for where the backend lives. Everything network-related in the
// app funnels through this module, so pointing the UI at a different API is a one-line change.

const env = import.meta.env as unknown as Record<string, string | undefined>

export const API_BASE = env.VITE_API_URL ?? 'http://127.0.0.1:8000/api'
