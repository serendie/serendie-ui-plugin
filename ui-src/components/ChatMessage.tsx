import tokens from '@serendie/design-token'

const { sd } = tokens

export default function ChatMessage({
  role,
  content,
  image,
}: {
  role: 'user' | 'assistant'
  content: string
  image?: string
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
      {image && (
        <img
          src={image}
          alt='添付画像'
          style={{
            maxWidth: '200px',
            borderRadius: sd.system.dimension.radius.medium,
            border: `1px solid ${sd.system.color.component.outlineVariant}`,
          }}
        />
      )}
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
        }}
      >
        <p
          style={{
            ...sd.system.typography.body.medium_expanded,
            lineHeight: sd.reference.typography.lineHeight.tight,
            color:
              role === 'user'
                ? sd.system.color.impression.onPrimary
                : sd.system.color.component.onSurface,
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            whiteSpace: 'pre-wrap',
          }}
        >
          {content}
        </p>
      </div>
    </div>
  )
}
