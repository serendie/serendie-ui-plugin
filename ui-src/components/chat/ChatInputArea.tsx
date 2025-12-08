import { Button, TextField } from '@serendie/ui'
import tokens from '@serendie/design-token'

const { sd } = tokens

interface ChatInputAreaProps {
  message: string
  onMessageChange: (value: string) => void
  onSend: () => void
}

export default function ChatInputArea({
  message,
  onMessageChange,
  onSend,
}: ChatInputAreaProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      if (message.trim() !== '') onSend()
    }
  }

  const handleSend = () => {
    if (message.trim() !== '') onSend()
  }

  return (
    <div
      style={{
        padding: sd.system.dimension.spacing.large,
        display: 'flex',
        gap: sd.system.dimension.spacing.medium,
        alignItems: 'center',
      }}
    >
      <TextField
        placeholder='メッセージを入力'
        style={{ flex: 1 }}
        value={message}
        onChange={e => onMessageChange(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <Button
        style={{ flexShrink: 0 }}
        disabled={message.trim() === ''}
        onClick={handleSend}
      >
        送信
      </Button>
    </div>
  )
}
