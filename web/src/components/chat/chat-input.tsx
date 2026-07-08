import { useRef, useState } from 'react'
import { ArrowUp, Paperclip, Square } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface ChatInputProps {
  onSend: (text: string) => void
  onStop: () => void
  onAttach?: (file: File) => void
  isStreaming: boolean
  disabled?: boolean
  placeholder?: string
}

const MAX_HEIGHT = 200

export function ChatInput({ onSend, onStop, onAttach, isStreaming, disabled, placeholder }: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const attachRef = useRef<HTMLInputElement>(null)

  function autoGrow() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`
  }

  function submit() {
    const text = value.trim()
    if (!text || isStreaming || disabled) return
    onSend(text)
    setValue('')
    requestAnimationFrame(() => {
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
    })
  }

  return (
    <div className="rounded-[28px] border border-border bg-card px-3 pt-3 pb-2.5 shadow-sm transition-colors focus-within:border-muted-foreground/30">
      <textarea
        ref={textareaRef}
        value={value}
        rows={1}
        disabled={disabled}
        placeholder={placeholder ?? 'Ask Aptavach about your sources…'}
        onChange={(e) => {
          setValue(e.target.value)
          autoGrow()
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            submit()
          }
        }}
        className="max-h-50 w-full resize-none bg-transparent px-1 text-[15px] leading-7 outline-none placeholder:text-muted-foreground disabled:opacity-50"
      />

      <div className="mt-1.5 flex items-center justify-between">
        <div className="flex items-center">
          {onAttach && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="rounded-full text-muted-foreground"
                onClick={() => attachRef.current?.click()}
                aria-label="Add a source"
                title="Add a source"
              >
                <Paperclip />
              </Button>
              <input
                ref={attachRef}
                type="file"
                hidden
                accept=".pdf,.docx,.txt,.md,.markdown"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) onAttach(file)
                  e.target.value = ''
                }}
              />
            </>
          )}
        </div>

        {isStreaming ? (
          <Button
            size="icon"
            variant="secondary"
            className="rounded-full"
            onClick={onStop}
            aria-label="Stop"
            title="Stop generating"
          >
            <Square className="size-3.5 fill-current" />
          </Button>
        ) : (
          <Button
            size="icon"
            className="rounded-full"
            onClick={submit}
            disabled={disabled || value.trim().length === 0}
            aria-label="Send"
            title="Send"
          >
            <ArrowUp />
          </Button>
        )}
      </div>
    </div>
  )
}
