import tokens from '@serendie/design-token'

const { sd } = tokens

export default function IssueTitle({ title }: { title: string }) {
  return (
    <p
      style={{
        ...sd.system.typography.label.medium_expanded,
        color: sd.system.color.component.onSurfaceVariant,
        marginBottom: sd.system.dimension.spacing.extraSmall,
      }}
    >
      {title}
    </p>
  )
}
