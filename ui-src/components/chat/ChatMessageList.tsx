import { forwardRef, useImperativeHandle } from 'react'
import { ModelMessage, ToolContent } from 'ai'
import tokens from '@serendie/design-token'

import ChatMessage from './ChatMessage'
import getToolDescription from '../../utils/getToolDescription'
import { useAutoScroll } from '../../hooks/useAutoScroll'
import { getImageMetaKey, ImageMetas } from '../../utils/getImageMetaKey'

const { sd } = tokens

interface ChatMessageListProps {
  messages: ModelMessage[]
  imageMetas: ImageMetas
  isStreaming?: boolean
  hasApiKey?: boolean
  onOpenSettings?: () => void
}

export interface ChatMessageListRef {
  scrollToBottom: () => void
}

const ChatMessageList = forwardRef<ChatMessageListRef, ChatMessageListProps>(
  function ChatMessageList(
    { messages, imageMetas, isStreaming, hasApiKey = true, onOpenSettings },
    ref
  ) {
    const { scrollContainerRef, scrollToBottom } = useAutoScroll(messages)

    useImperativeHandle(ref, () => ({
      scrollToBottom,
    }))

    return (
      <div
        ref={scrollContainerRef}
        style={{
          flex: 1,
          overflow: 'auto',
          padding: `${sd.system.dimension.spacing.extraLarge} ${sd.system.dimension.spacing.extraLarge} 8rem`,
          position: 'relative',
        }}
      >
        {!hasApiKey && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: sd.system.dimension.spacing.extraLarge,
              pointerEvents: 'none',
            }}
          >
            <button
              type='button'
              onClick={onOpenSettings}
              style={{
                ...sd.system.typography.body.medium_expanded,
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                color: sd.system.color.component.onSurfaceVariant,
                textAlign: 'center',
                pointerEvents: 'auto',
              }}
            >
              OpenAI API Keyを設定してください
            </button>
          </div>
        )}
        {messages
          .map((msg, originalIndex) => ({ ...msg, originalIndex }))
          .filter(
            ({ role }) =>
              role === 'user' || role === 'assistant' || role === 'tool'
          )
          .map(({ role, content, originalIndex }, index, filtered) => {
            const isLastAssistant =
              role === 'assistant' && index === filtered.length - 1
            if (role === 'tool') {
              const toolContent = content as ToolContent
              if (toolContent?.[0].toolName) {
                return (
                  <p
                    key={originalIndex}
                    style={{
                      ...sd.system.typography.label.small_expanded,
                      color: sd.system.color.component.onSurfaceVariant,
                      marginBottom: sd.system.dimension.spacing.twoExtraSmall,
                      padding: `${sd.system.dimension.spacing.small} 0`,
                    }}
                  >
                    {getToolDescription(toolContent[0].toolName)}
                  </p>
                )
              }
            }

            const textContent = Array.isArray(content)
              ? content.find(part => part.type === 'text')?.text || ''
              : (content as string)

            const imageContents = Array.isArray(content)
              ? content
                  .filter(part => part.type === 'image')
                  .map(part =>
                    typeof part.image === 'string' ? part.image : ''
                  )
                  .filter(Boolean)
              : []

            if (!textContent && imageContents.length === 0) {
              return null
            }

            const imageLabels = imageContents.map((_, imageIndex) => {
              const item =
                imageMetas[getImageMetaKey(originalIndex, imageIndex)]
              return item?.label ?? ''
            })

            return (
              <ChatMessage
                key={originalIndex}
                role={role as 'user' | 'assistant'}
                content={textContent}
                images={imageContents.length > 0 ? imageContents : undefined}
                imageLabels={imageLabels.length > 0 ? imageLabels : undefined}
                isStreaming={isLastAssistant && isStreaming}
              />
            )
          })}
      </div>
    )
  }
)

export default ChatMessageList
