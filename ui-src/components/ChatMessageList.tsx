import { ModelMessage, ToolContent } from 'ai'
import { useMemo } from 'react'
import { Button } from '@serendie/ui'
import tokens from '@serendie/design-token'

import ChatMessage from './ChatMessage'
import getToolDescription from '../utils/getToolDescription'
import { useAutoScroll } from '../hooks/useAutoScroll'
import { Result } from '../models/Result'

const { sd } = tokens

interface ChatMessageListProps {
  chatHistory: ModelMessage[]
  result: Result | null
  questions: string[]
  isLoadingQuestions: boolean
  onTemplateClick: (template: string) => void
}

export default function ChatMessageList({
  chatHistory,
  result,
  questions,
  isLoadingQuestions,
  onTemplateClick,
}: ChatMessageListProps) {
  const scrollContainerRef = useAutoScroll(chatHistory)
  const showTemplates = useMemo(() => {
    return (
      chatHistory.length === 1 &&
      chatHistory[0].role === 'user' &&
      Array.isArray(chatHistory[0].content) &&
      chatHistory[0].content.some(part => part.type === 'image')
    )
  }, [chatHistory, result])

  return (
    <div
      ref={scrollContainerRef}
      style={{
        flex: 1,
        overflow: 'auto',
        padding: sd.system.dimension.spacing.large,
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

          const imagePart = Array.isArray(content)
            ? content.find(part => part.type === 'image')
            : undefined

          const imageContent =
            imagePart && typeof imagePart.image === 'string'
              ? imagePart.image
              : undefined

          return (
            <ChatMessage
              key={index}
              role={role as 'user' | 'assistant'}
              content={imageContent ? '' : textContent}
              image={imageContent}
            />
          )
        })}
      {showTemplates && !isLoadingQuestions && questions.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: sd.system.dimension.spacing.extraSmall,
            marginTop: sd.system.dimension.spacing.medium,
          }}
        >
          {questions.map((question, index) => (
            <Button
              key={index}
              styleType='outlined'
              size='small'
              onClick={() => onTemplateClick(question)}
              style={{
                width: 'fit-content',
                animation: `fadeIn 0.5s ease-in-out ${index * 0.25}s both`,
              }}
            >
              {question}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
