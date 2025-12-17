import tokens from '@serendie/design-token'
import MarkdownRenderer from './MarkdownRenderer'

const { sd } = tokens

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
        width: 'fit-content',
        maxWidth: role === 'user' ? '80%' : '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: sd.system.dimension.spacing.small,
        alignItems: role === 'user' ? 'flex-end' : 'flex-start',
      }}
    >
      {images &&
        images.map((image, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
            }}
          >
            <img
              src={image}
              alt={imageLabels?.[index] || '添付画像'}
              style={{
                backgroundColor: sd.system.color.component.surface,
                maxHeight: '40vh',
              }}
            />
            {imageLabels?.[index] && (
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
                {imageLabels[index]}
              </p>
            )}
          </div>
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
            <div
              style={{
                ...sd.system.typography.body.medium_expanded,
                color: sd.system.color.impression.onPrimary,
                wordBreak: 'break-word',
              }}
            >
              {content}
            </div>
          ) : (
            <div style={{ color: sd.system.color.component.onSurface }}>
              <MarkdownRenderer>{content}</MarkdownRenderer>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
