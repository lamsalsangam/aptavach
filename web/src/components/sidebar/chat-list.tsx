import { Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Chat } from '@/lib/types'

interface ChatListProps {
  chats: Chat[]
  currentChatId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}

export function ChatList({ chats, currentChatId, onSelect, onDelete }: ChatListProps) {
  if (chats.length === 0) {
    return <p className="px-4 py-2 text-xs text-muted-foreground">No chats yet.</p>
  }

  return (
    <ul className="space-y-0.5 px-2">
      {chats.map((chat) => (
        <li key={chat.id}>
          <div
            className={cn(
              'group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors',
              chat.id === currentChatId ? 'bg-muted' : 'hover:bg-muted/60',
            )}
          >
            <button type="button" onClick={() => onSelect(chat.id)} className="min-w-0 flex-1 truncate text-left">
              {chat.title}
            </button>
            <Button
              variant="ghost"
              size="icon-xs"
              className="opacity-0 transition-opacity group-hover:opacity-100"
              onClick={() => onDelete(chat.id)}
              aria-label="Delete chat"
              title="Delete chat"
            >
              <Trash2 />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  )
}
