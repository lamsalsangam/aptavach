// App-level domain types shared across hooks and UI.
import type { Citation } from '@/lib/api'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
  pending?: boolean
}

export interface Chat {
  id: string
  projectId: string
  title: string
  createdAt: number
  updatedAt: number
  messages: ChatMessage[]
}
