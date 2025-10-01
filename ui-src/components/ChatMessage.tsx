import tokens from '@serendie/design-token'

const { sd } = tokens

export default function ChatMessage({
  role,
  content,
}: {
  role: 'user' | 'assistant'
  content: string
}) {
  return (
    <div
      style={{
        marginBottom: sd.system.dimension.spacing.medium,
        marginRight: role === 'user' ? 0 : 'auto',
        marginLeft: role === 'user' ? 'auto' : 0,
        width: 'fit-content',
        maxWidth: '80%',
        padding: `${sd.system.dimension.spacing.extraSmall} ${sd.system.dimension.spacing.small}`,
        borderRadius: sd.system.dimension.radius.medium,
        borderTopLeftRadius:
          role === 'assistant' ? 0 : sd.system.dimension.radius.medium,
        borderTopRightRadius:
          role === 'user' ? 0 : sd.system.dimension.radius.medium,
        backgroundColor:
          role === 'user'
            ? sd.system.color.impression.primary
            : sd.system.color.component.surface,
      }}
    >
      <div
        style={{
          ...sd.system.typography.body.medium_expanded,
          color:
            role === 'user'
              ? sd.system.color.impression.onPrimary
              : sd.system.color.component.onSurface,
        }}
      >
        {content}
      </div>
    </div>
  )
}
