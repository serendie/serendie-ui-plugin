import { ProgressIndicatorIndeterminate } from '@serendie/ui'
import tokens from '@serendie/design-token'

const { sd } = tokens

export default function ComponentValidationStatus() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: sd.system.dimension.spacing.small,
        padding: sd.system.dimension.spacing.small,
        backgroundColor: sd.system.color.component.surface,
        borderRadius: sd.system.dimension.radius.medium,
      }}
    >
      <ProgressIndicatorIndeterminate size='small' type='circular' />
      <span
        style={{
          ...sd.system.typography.body.extraSmall_expanded,
          color: sd.system.color.component.onSurfaceVariant,
        }}
      >
        Serendie UIを適用できるか検証しています
      </span>
    </div>
  )
}
