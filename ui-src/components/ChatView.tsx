import tokens from '@serendie/design-token'
import { useEffect, useMemo } from 'react'

import { useApiKey } from '../hooks/useApiKey'
import { useMCPTools } from '../hooks/useMCPTools'
import { useDocsSearchTools } from '../hooks/useDocsSearchTools'
import { useSelectionImage } from '../hooks/useSelectionImage'
import { useChat } from '../hooks/useChat'
import { useQuestions } from '../hooks/useQuestions'
import ChatHeader from './ChatHeader'
import ChatMessageList from './ChatMessageList'
import ChatInputArea from './ChatInputArea'
import { Result, serializeResult } from '../models/Result'

const { sd } = tokens

interface ChatViewProps {
  result: Result | null
  onBack: () => void
}

export default function ChatView({ result, onBack }: ChatViewProps) {
  const { apiKey } = useApiKey()
  const mcpTools = useMCPTools()
  const docsSearchTools = useDocsSearchTools()

  const tools = useMemo(() => {
    if (!mcpTools) return docsSearchTools
    return { ...mcpTools, ...docsSearchTools }
  }, [mcpTools, docsSearchTools])

  const { message, setMessage, chatHistory, setChatHistory, request } = useChat(
    {
      apiKey,
      tools,
      result,
    }
  )
  const selectionImage = useSelectionImage(result)
  const { questions, isLoading: isLoadingQuestions } = useQuestions({
    apiKey,
    result,
    imageData: selectionImage ?? undefined,
  })

  useEffect(() => {
    if (selectionImage && result) {
      setChatHistory([
        {
          role: 'user',
          content: [
            { type: 'image', image: selectionImage },
            { type: 'text', text: serializeResult(result) },
          ],
        },
      ])
    }
  }, [selectionImage, result])

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
        questions={questions}
        isLoadingQuestions={isLoadingQuestions}
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
