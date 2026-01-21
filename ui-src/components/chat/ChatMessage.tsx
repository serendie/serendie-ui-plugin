import { useState } from 'react'
import tokens from '@serendie/design-token'
import { SerendieSymbol } from '@serendie/symbols'
import MarkdownRenderer from './MarkdownRenderer'

const { sd } = tokens

function UserMessage({ content }: { content: string }) {
  return (
    <div
      style={{
        ...sd.system.typography.body.medium_expanded,
        color: sd.system.color.impression.onPrimary,
        wordBreak: 'break-word',
      }}
    >
      {content}
    </div>
  )
}

function AssistantMessage({ content }: { content: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      const textArea = document.createElement('textarea')
      textArea.value = content
      textArea.style.position = 'fixed'
      textArea.style.left = '9999px'
      textArea.style.top = '9999px'
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return (
    <div
      style={{
        color: sd.system.color.component.onSurface,
        position: 'relative',
      }}
    >
      <MarkdownRenderer>{content}</MarkdownRenderer>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: sd.system.dimension.spacing.extraSmall,
        }}
      >
        <button
          onClick={handleCopy}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: sd.system.dimension.spacing.twoExtraSmall,
            borderRadius: sd.system.dimension.radius.small,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: sd.system.color.component.onSurfaceVariant,
          }}
          type='button'
        >
          <SerendieSymbol
            name={copied ? 'check' : 'copy'}
            style={{ fontSize: '20px' }}
          />
        </button>
      </div>
    </div>
  )
}

function Image({ image, label }: { image: string; label: string | null }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        maxWidth: '100%',
        overflow: 'hidden',
      }}
    >
      <img
        src={image}
        alt={label ?? '添付画像'}
        style={{
          backgroundColor: sd.system.color.component.surface,
          maxHeight: '40vh',
          maxWidth: '100%',
          objectFit: 'contain',
        }}
      />
      {label && (
        <p
          style={{
            ...sd.system.typography.label.small_expanded,
            color: sd.system.color.component.onSurfaceVariant,
            marginTop: sd.system.dimension.spacing.twoExtraSmall,
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </p>
      )}
    </div>
  )
}

export default function ChatMessage({
  role,
  content,
  images,
  imageLabels,
}: {
  role: 'user' | 'assistant'
  content: string
  images?: string[]
  imageLabels?: string[]
}) {
  return (
    <div
      style={{
        marginBottom: sd.system.dimension.spacing.large,
        marginRight: role === 'user' ? 0 : 'auto',
        marginLeft: role === 'user' ? 'auto' : 0,
        maxWidth: role === 'user' ? '80%' : '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: sd.system.dimension.spacing.small,
        alignItems: role === 'user' ? 'flex-end' : 'flex-start',
      }}
    >
      {images &&
        images.map((image, index) => (
          <Image key={index} image={image} label={imageLabels?.[index]} />
        ))}
      {content && (
        <div
          style={{
            padding:
              role === 'user'
                ? `${sd.system.dimension.spacing.extraSmall} ${sd.system.dimension.spacing.medium}`
                : 0,
            borderRadius: sd.system.dimension.radius.extraLarge,
            borderTopRightRadius:
              role === 'user' ? 0 : sd.system.dimension.radius.extraLarge,
            backgroundColor:
              role === 'user'
                ? sd.system.color.impression.primary
                : 'transparent',
            overflowWrap: 'break-word',
          }}
        >
          {role === 'user' ? (
            <UserMessage content={content} />
          ) : (
            <AssistantMessage content={content} />
          )}
        </div>
      )}
    </div>
  )
}
