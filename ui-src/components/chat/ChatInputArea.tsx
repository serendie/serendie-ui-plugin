import { useRef, useEffect } from 'react'
import { IconButton } from '@serendie/ui'
import { SerendieSymbol } from '@serendie/symbols'
import tokens from '@serendie/design-token'

const { sd } = tokens

interface ChatInputAreaProps {
  message: string
  onMessageChange: (value: string) => void
  onSend: () => void
  selectionNames?: string[]
  isSending?: boolean
}

export default function ChatInputArea({
  message,
  onMessageChange,
  onSend,
  selectionNames = [],
  isSending = false,
}: ChatInputAreaProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      if (message.trim() !== '') onSend()
    }
  }

  const handleSend = () => {
    if (message.trim() !== '') onSend()
  }

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [message])

  const selectionLabel =
    selectionNames.length === 0
      ? '選択なし'
      : selectionNames.length === 1
        ? `"${selectionNames[0]}"を選択`
        : `"${selectionNames[0]}"、他${selectionNames.length - 1}つを選択`

  return (
    <div
      style={{
        padding: sd.system.dimension.spacing.extraLarge,
      }}
    >
      <div
        style={{
          backgroundColor: sd.system.color.component.surface,
          border: `1px solid ${sd.system.color.component.outline}`,
          borderRadius: sd.system.dimension.radius.medium,
          paddingTop: sd.system.dimension.spacing.small,
          paddingLeft: sd.system.dimension.spacing.medium,
          paddingRight: sd.system.dimension.spacing.medium,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <textarea
          ref={textareaRef}
          placeholder='メッセージを入力'
          value={message}
          onChange={e => onMessageChange(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          style={{
            ...sd.system.typography.body.extraSmall_expanded,
            color: sd.system.color.component.onSurface,
            border: 'none',
            outline: 'none',
            resize: 'none',
            background: 'transparent',
            width: '100%',
          }}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            padding: `${sd.system.dimension.spacing.extraSmall} 0`,
          }}
        >
          <div
            style={{
              paddingBottom: sd.system.dimension.spacing.twoExtraSmall,
            }}
          >
            {selectionLabel && (
              <span
                style={{
                  ...sd.system.typography.label.small_expanded,
                  color: sd.system.color.component.onSurfaceVariant,
                }}
              >
                {selectionLabel}
              </span>
            )}
          </div>
          <IconButton
            shape='rectangle'
            size='small'
            styleType='filled'
            disabled={message.trim() === '' || isSending}
            onClick={handleSend}
            icon={<SerendieSymbol name='send' />}
          />
        </div>
      </div>
    </div>
  )
}
