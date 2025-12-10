import tokens from '@serendie/design-token'
import { useCallback, useMemo, useState } from 'react'

import { useApiKey } from '../../hooks/useApiKey'
import { useMCPTools } from '../../hooks/useMCPTools'
import { useDocsSearchTools } from '../../hooks/useDocsSearchTools'
import { useSelectionImages } from '../../hooks/useSelectionImages'
import { useChat } from '../../hooks/useChat'
import { useSelection } from '../../hooks/useSelection'
import { postPluginMessage } from '../../hooks/usePluginMessage'
import ChatMessageList from './ChatMessageList'
import ChatInputArea from './ChatInputArea'

const { sd } = tokens

export default function ChatView() {
  const { apiKey } = useApiKey()
  const { selections } = useSelection()
  const mcpTools = useMCPTools()
  const docsSearchTools = useDocsSearchTools()
  const { getSelectionImages } = useSelectionImages()
  const [isSending, setIsSending] = useState(false)

  const tools = useMemo(() => {
    if (!mcpTools) return docsSearchTools
    return { ...mcpTools, ...docsSearchTools }
  }, [mcpTools, docsSearchTools])

  const { message, setMessage, chatHistory, imageMetas, request } = useChat({
    apiKey,
    tools,
  })

  const handleSend = useCallback(
    async (customMessage?: string) => {
      const messageToSend = customMessage ?? message
      if (messageToSend.trim() === '') return

      setIsSending(true)
      try {
        const result =
          selections.length > 0
            ? await getSelectionImages(selections)
            : { images: [], labels: [] }
        if (result.images.length > 0) {
          postPluginMessage({ type: 'clear-selection' })
        }
        await request(
          messageToSend,
          result.images.length > 0 ? result.images : undefined,
          result.labels.length > 0 ? result.labels : undefined
        )
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
      <ChatMessageList chatHistory={chatHistory} imageMetas={imageMetas} />
      <div
        style={{
          padding: `0 ${sd.system.dimension.spacing.medium} ${sd.system.dimension.spacing.extraLarge}`,
        }}
      >
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
