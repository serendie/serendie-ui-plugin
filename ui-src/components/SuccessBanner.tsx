import tokens from '@serendie/design-token'

const { sd } = tokens

interface SuccessBannerProps {
  summary: string
}

export default function SuccessBanner({ summary }: SuccessBannerProps) {
  return (
    <div
      style={{
        padding: sd.system.dimension.spacing.large,
        borderRadius: sd.system.dimension.radius.medium,
        border: `1px solid ${sd.system.color.component.outline}`,
        backgroundColor: sd.system.color.component.surface,
        marginTop: sd.system.dimension.spacing.medium,
        display: 'flex',
        alignItems: 'flex-start',
        gap: sd.system.dimension.spacing.medium,
      }}
    >
      <span
        style={{
          fontSize: '24px',
          color: sd.system.color.impression.positive,
        }}
      >
        ✓
      </span>
      <div>
        <h3
          style={{
            ...sd.system.typography.title.small_expanded,
            color: sd.system.color.component.onSurface,
            margin: 0,
            marginBottom: sd.system.dimension.spacing.small,
          }}
        >
          Success
        </h3>
        <p
          style={{
            ...sd.system.typography.body.medium_expanded,
            color: sd.system.color.component.onSurface,
            margin: 0,
          }}
        >
          {summary}
        </p>
      </div>
    </div>
  )
}