// Per-project conversations. Chats + messages live in localStorage; sending a message streams a
// project-scoped answer into the in-flight assistant message. localStorage is written only at
// message boundaries (not per token) to stay cheap.
import { useEffect, useRef, useState } from 'react'

import { streamChat } from '@/lib/api'
import { loadChats, removeChat, saveChat } from '@/lib/chat-store'
import type { Chat, ChatMessage } from '@/lib/types'

export function useChats(projectId: string | null) {
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!projectId) {
      setChats([])
      setCurrentChatId(null)
      return
    }
    const loaded = loadChats(projectId)
    setChats(loaded)
    setCurrentChatId(loaded[0]?.id ?? null)
  }, [projectId])

  const currentChat = chats.find((c) => c.id === currentChatId) ?? null

  function upsert(chat: Chat, persist: boolean) {
    if (persist) saveChat(chat)
    setChats((prev) => {
      const others = prev.filter((c) => c.id !== chat.id)
      return [chat, ...others].sort((a, b) => b.updatedAt - a.updatedAt)
    })
  }

  function newChat() {
    abortRef.current?.abort()
    setCurrentChatId(null)
    setError(null)
  }

  function selectChat(id: string) {
    setCurrentChatId(id)
    setError(null)
  }

  function deleteChat(id: string) {
    removeChat(id)
    setChats((prev) => prev.filter((c) => c.id !== id))
    if (currentChatId === id) setCurrentChatId(null)
  }

  async function sendMessage(text: string) {
    const content = text.trim()
    if (!content || isStreaming || !projectId) return
    setError(null)

    const now = Date.now()
    const base: Chat = currentChat ?? {
      id: crypto.randomUUID(),
      projectId,
      title: content.length > 48 ? `${content.slice(0, 48)}…` : content,
      createdAt: now,
      updatedAt: now,
      messages: [],
    }
    if (!currentChat) setCurrentChatId(base.id)

    const assistantId = crypto.randomUUID()
    let working: Chat = {
      ...base,
      updatedAt: now,
      messages: [
        ...base.messages,
        { id: crypto.randomUUID(), role: 'user', content },
        { id: assistantId, role: 'assistant', content: '', pending: true },
      ],
    }
    upsert(working, true)
    setIsStreaming(true)

    const controller = new AbortController()
    abortRef.current = controller

    const patch = (fn: (m: ChatMessage) => ChatMessage, persist = false) => {
      working = {
        ...working,
        updatedAt: Date.now(),
        messages: working.messages.map((m) => (m.id === assistantId ? fn(m) : m)),
      }
      upsert(working, persist)
    }

    try {
      await streamChat(projectId, content, {
        signal: controller.signal,
        onToken: (t) => patch((m) => ({ ...m, content: m.content + t, pending: false })),
        onSources: (sources) => patch((m) => ({ ...m, citations: sources })),
        onDone: () => patch((m) => ({ ...m, pending: false }), true),
      })
    } catch (err) {
      if (controller.signal.aborted) {
        patch((m) => ({ ...m, pending: false }), true)
      } else {
        const message = err instanceof Error ? err.message : 'Something went wrong.'
        setError(message)
        patch((m) => ({ ...m, content: m.content || `⚠️ ${message}`, pending: false }), true)
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

  return {
    chats,
    currentChat,
    currentChatId,
    isStreaming,
    error,
    newChat,
    selectChat,
    deleteChat,
    sendMessage,
    stop,
  }
}
