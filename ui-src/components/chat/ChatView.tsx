import tokens from '@serendie/design-token'
import { useCallback, useMemo, useRef, useState } from 'react'

import { useApiKey } from '../../hooks/useApiKey'
import { useMCPTools } from '../../hooks/useMCPTools'
import { useDocsSearchTools } from '../../hooks/useDocsSearchTools'
import { useLinterTool } from '../../hooks/useLinterTool'
import { useSelectionImages } from '../../hooks/useSelectionImages'
import { useChat } from '../../hooks/useChat'
import { useChatSessions } from '../../hooks/useChatSessions'
import { useSelection } from '../../hooks/useSelection'
import { useQuestions } from '../../hooks/useQuestions'
import { postPluginMessage } from '../../hooks/usePluginMessage'
import ChatMessageList, { ChatMessageListRef } from './ChatMessageList'
import ChatInputArea from './ChatInputArea'
import ChatHeader from './ChatHeader'
import ChatHistoryModal from './ChatHistoryModal'
import SuggestedQuestions from './SuggestedQuestions'

const { sd } = tokens

export default function ChatView({ isActive }: { isActive: boolean }) {
  const { apiKey } = useApiKey()
  const { selections } = useSelection()
  const mcpTools = useMCPTools()
  const docsSearchTools = useDocsSearchTools()
  const { getSelectionImages } = useSelectionImages()
  const [isSending, setIsSending] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const linterTool = useLinterTool()
  const viewRef = useRef<ChatMessageListRef>(null)

  const tools = useMemo(() => {
    const baseTools = { ...docsSearchTools, ...linterTool }
    if (!mcpTools) return baseTools
    return { ...mcpTools, ...baseTools }
  }, [mcpTools, docsSearchTools, linterTool])

  const {
    sessions,
    currentSessionId,
    saveSession,
    loadSession,
    startNewSession,
  } = useChatSessions(apiKey)

  const currentSessionTitle = useMemo(() => {
    if (!currentSessionId) return undefined
    return sessions.find(s => s.id === currentSessionId)?.title
  }, [sessions, currentSessionId])

  const {
    message,
    setMessage,
    messages,
    setMessages,
    imageMetas,
    setImageMetas,
    clearChat,
    request,
    abort,
    isStreaming,
  } = useChat({
    apiKey,
    tools,
    onComplete: saveSession,
  })

  const hasChat = messages.length > 0

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

  const handleSelectSession = useCallback(
    async (sessionId: string) => {
      const session = await loadSession(sessionId)
      if (session) {
        setMessages(session.messages)
        setImageMetas(session.imageMetas)
        clearQuestions()
        // 次のレンダリング後にスクロール
        requestAnimationFrame(() => {
          viewRef.current?.scrollToBottom()
        })
      }
    },
    [loadSession, setMessages, setImageMetas, clearQuestions]
  )

  const handleNewChat = useCallback(() => {
    // 現在のチャットを保存してから新規開始
    if (messages.length > 0) {
      saveSession(messages, imageMetas)
    }
    startNewSession()
    clearChat()
    clearQuestions()
  }, [
    messages,
    imageMetas,
    saveSession,
    startNewSession,
    clearChat,
    clearQuestions,
  ])

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
        title={currentSessionTitle}
        onNewChat={handleNewChat}
        onOpenHistory={() => setHistoryOpen(true)}
      />
      <ChatMessageList
        ref={viewRef}
        messages={messages}
        imageMetas={imageMetas}
      />
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
          onStop={abort}
          selectionNames={selections.map(s => s.name)}
          isSending={isSending}
          isStreaming={isStreaming}
        />
      </div>
      <ChatHistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        sessions={sessions}
        onSelectSession={handleSelectSession}
      />
    </div>
  )
}
