// Chat state + streaming orchestration. Owns the message list and drives streamChat(),
// accumulating tokens into the in-flight assistant message and attaching its citations.
import { useRef, useState } from 'react'

import { streamChat } from '@/lib/api'
import type { Citation } from '@/lib/api'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
  pending?: boolean
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  async function sendMessage(text: string) {
    const content = text.trim()
    if (!content || isStreaming) return

    setError(null)
    const assistantId = crypto.randomUUID()
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: 'user', content },
      { id: assistantId, role: 'assistant', content: '', pending: true },
    ])
    setIsStreaming(true)

    const controller = new AbortController()
    abortRef.current = controller

    const patch = (fn: (m: ChatMessage) => ChatMessage) =>
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? fn(m) : m)))

    try {
      await streamChat(content, {
        signal: controller.signal,
        onToken: (t) => patch((m) => ({ ...m, content: m.content + t, pending: false })),
        onSources: (sources) => patch((m) => ({ ...m, citations: sources })),
        onDone: () => patch((m) => ({ ...m, pending: false })),
      })
    } catch (err) {
      if (!controller.signal.aborted) {
        const message = err instanceof Error ? err.message : 'Something went wrong.'
        setError(message)
        patch((m) => ({ ...m, content: m.content || `⚠️ ${message}`, pending: false }))
      }
    } finally {
      setIsStreaming(false)
      abortRef.current = null
    }
  }

  function stop() {
    abortRef.current?.abort()
    setIsStreaming(false)
  }

  function reset() {
    stop()
    setMessages([])
    setError(null)
  }

  return { messages, isStreaming, error, sendMessage, stop, reset }
}
