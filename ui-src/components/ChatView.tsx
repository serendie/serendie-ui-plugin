import tokens from '@serendie/design-token'
import { useEffect } from 'react'

import { Result } from '../App'
import { useApiKey } from '../hooks/useApiKey'
import { useMCPTools } from '../hooks/useMCPTools'
import { useSelectionImage } from '../hooks/useSelectionImage'
import { useChat } from '../hooks/useChat'
import ChatHeader from './ChatHeader'
import ChatMessageList from './ChatMessageList'
import ChatInputArea from './ChatInputArea'

const { sd } = tokens

interface ChatViewProps {
  result: Result | null
  onBack: () => void
}

export default function ChatView({ result, onBack }: ChatViewProps) {
  const { apiKey } = useApiKey()
  const tools = useMCPTools()
  const { message, setMessage, chatHistory, setChatHistory, request } = useChat(
    {
      apiKey,
      tools,
      result,
    }
  )
  const selectionImage = useSelectionImage(result)

  useEffect(() => {
    if (selectionImage) {
      setChatHistory([
        {
          role: 'user',
          content: [{ type: 'image', image: selectionImage }],
        },
      ])
    }
  }, [selectionImage])

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: sd.reference.typography.fontFamily.primary,
        backgroundColor: sd.system.color.impression.tertiary,
      }}
    >
      <ChatHeader result={result} onBack={onBack} />
      <ChatMessageList
        chatHistory={chatHistory}
        result={result}
        onTemplateClick={template => request(template)}
      />
      <ChatInputArea
        message={message}
        onMessageChange={setMessage}
        onSend={() => request()}
      />
    </div>
  )
}
