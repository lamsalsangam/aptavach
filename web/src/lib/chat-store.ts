// Chat history lives in the browser (localStorage) for now — a deliberate, revisit-later choice.
// Projects and documents stay server-side; only conversations are local.
import type { Chat } from './types'

const KEY = 'aptavach:chats:v1'

function readAll(): Chat[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Chat[]) : []
  } catch {
    return []
  }
}

function writeAll(chats: Chat[]) {
  localStorage.setItem(KEY, JSON.stringify(chats))
}

export function loadChats(projectId: string): Chat[] {
  return readAll()
    .filter((chat) => chat.projectId === projectId)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    // Clear any transient "pending" flags left over from a reload mid-stream.
    .map((chat) => ({
      ...chat,
      messages: chat.messages.map((m) => ({ ...m, pending: false })),
    }))
}

export function saveChat(chat: Chat) {
  const all = readAll().filter((c) => c.id !== chat.id)
  all.push(chat)
  writeAll(all)
}

export function removeChat(chatId: string) {
  writeAll(readAll().filter((c) => c.id !== chatId))
}

export function removeChatsForProject(projectId: string) {
  writeAll(readAll().filter((c) => c.projectId !== projectId))
}
