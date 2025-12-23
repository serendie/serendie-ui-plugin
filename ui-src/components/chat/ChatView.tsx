import tokens from '@serendie/design-token'
import { useCallback, useMemo, useState } from 'react'

import { useApiKey } from '../../hooks/useApiKey'
import { useMCPTools } from '../../hooks/useMCPTools'
import { useDocsSearchTools } from '../../hooks/useDocsSearchTools'
import { useLinterTool } from '../../hooks/useLinterTool'
import { useSelectionImages } from '../../hooks/useSelectionImages'
import { useChat } from '../../hooks/useChat'
import { useSelection } from '../../hooks/useSelection'
import { useQuestions } from '../../hooks/useQuestions'
import { postPluginMessage } from '../../hooks/usePluginMessage'
import ChatMessageList from './ChatMessageList'
import ChatInputArea from './ChatInputArea'
import ChatHeader from './ChatHeader'
import SuggestedQuestions from './SuggestedQuestions'

const { sd } = tokens

export default function ChatView({ isActive }: { isActive: boolean }) {
  const { apiKey } = useApiKey()
  const { selections } = useSelection()
  const mcpTools = useMCPTools()
  const docsSearchTools = useDocsSearchTools()
  const { getSelectionImages } = useSelectionImages()
  const [isSending, setIsSending] = useState(false)
  const linterTool = useLinterTool()

  const tools = useMemo(() => {
    const baseTools = { ...docsSearchTools, ...linterTool }
    if (!mcpTools) return baseTools
    return { ...mcpTools, ...baseTools }
  }, [mcpTools, docsSearchTools, linterTool])

  const { message, setMessage, chatHistory, imageMetas, clearChat, request } =
    useChat({
      apiKey,
      tools,
    })

  const hasChat = chatHistory.length > 0

  const {
    questions,
    isLoading: isQuestionsLoading,
    clearQuestions,
  } = useQuestions({
    apiKey,
    selections,
    getSelectionImages,
    hasChat,
    isActive,
  })

  const handleSend = useCallback(
    async (customMessage?: string) => {
      const messageToSend = customMessage ?? message
      if (messageToSend.trim() === '') return

      setIsSending(true)
      try {
        const items =
          selections.length > 0 ? await getSelectionImages(selections) : []
        if (items.length > 0) {
          postPluginMessage({ type: 'clear-selection' })
        }
        await request(messageToSend, items.length > 0 ? items : undefined)
      } finally {
        setIsSending(false)
      }
    },
    [message, selections, getSelectionImages, request]
  )

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: sd.reference.typography.fontFamily.primary,
        backgroundColor: sd.system.color.impression.tertiary,
      }}
    >
      <ChatHeader
        onNewChat={() => {
          clearChat()
          clearQuestions()
        }}
      />
      <ChatMessageList chatHistory={chatHistory} imageMetas={imageMetas} />
      <div
        style={{
          position: 'relative',
          padding: `0 ${sd.system.dimension.spacing.medium} ${sd.system.dimension.spacing.extraLarge}`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            right: sd.system.dimension.spacing.medium,
            paddingBottom: sd.system.dimension.spacing.small,
          }}
        >
          <SuggestedQuestions
            questions={questions}
            onSelect={handleSend}
            isLoading={isQuestionsLoading}
          />
        </div>
        <ChatInputArea
          message={message}
          onMessageChange={setMessage}
          onSend={() => handleSend()}
          selectionNames={selections.map(s => s.name)}
          isSending={isSending}
        />
      </div>
    </div>
  )
}
