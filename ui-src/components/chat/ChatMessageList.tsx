import { ModelMessage, ToolContent } from 'ai'
import tokens from '@serendie/design-token'

import ChatMessage from './ChatMessage'
import getToolDescription from '../../utils/getToolDescription'
import { useAutoScroll } from '../../hooks/useAutoScroll'
import { getImageMetaKey, ImageMetas } from '../../utils/getImageMetaKey'

const { sd } = tokens

interface ChatMessageListProps {
  chatHistory: ModelMessage[]
  imageMetas: ImageMetas
}

export default function ChatMessageList({
  chatHistory,
  imageMetas,
}: ChatMessageListProps) {
  const scrollContainerRef = useAutoScroll(chatHistory)

  return (
    <div
      ref={scrollContainerRef}
      style={{
        flex: 1,
        overflow: 'auto',
        padding: `${sd.system.dimension.spacing.extraLarge} ${sd.system.dimension.spacing.extraLarge} 8rem`,
      }}
    >
      {chatHistory
        .filter(
          ({ role }) =>
            role === 'user' || role === 'assistant' || role === 'tool'
        )
        .map(({ role, content }, index) => {
          if (role === 'tool') {
            const toolContent = content as ToolContent
            if (toolContent?.[0].toolName) {
              return (
                <p
                  key={index}
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
                .map(part => (typeof part.image === 'string' ? part.image : ''))
                .filter(Boolean)
            : []

          const imageLabels = imageContents.map((_, imageIndex) => {
            const item = imageMetas[getImageMetaKey(index, imageIndex)]
            return item?.label ?? ''
          })

          return (
            <ChatMessage
              key={index}
              role={role as 'user' | 'assistant'}
              content={textContent}
              images={imageContents.length > 0 ? imageContents : undefined}
              imageLabels={imageLabels.length > 0 ? imageLabels : undefined}
            />
          )
        })}
    </div>
  )
}
