import tokens from '@serendie/design-token'
import { SerendieSymbol } from '@serendie/symbols'

const { sd } = tokens

export default function StatLabel({
  symbolName,
  targetNodes,
  totalNodes,
  label,
}: {
  symbolName: 'alert-circle' | 'alert-triangle' | 'check-circle'
  targetNodes: number
  totalNodes?: number
  label?: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: sd.system.dimension.spacing.twoExtraSmall,
      }}
    >
      <SerendieSymbol
        name={symbolName}
        variant='outlined'
        size={18}
        style={{
          color:
            symbolName === 'alert-circle'
              ? sd.system.color.impression.negative
              : symbolName === 'alert-triangle'
                ? sd.system.color.impression.notice
                : sd.system.color.impression.positive,
        }}
      />
      <p
        style={{
          ...sd.system.typography.body.small_expanded,
          color: sd.system.color.component.onSurfaceVariant,
        }}
      >
        {label ? `${targetNodes} ${label}` : `${targetNodes}/${totalNodes}`}
      </p>
    </div>
  )
}
