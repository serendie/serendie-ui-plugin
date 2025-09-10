import tokens from '@serendie/design-token'
import { SerendieSymbol, SymbolName } from '@serendie/symbols'

const { sd } = tokens

interface NotificationProps {
  summary: string
  variant?: 'success' | 'info' | 'warning' | 'error'
}

export default function Notification({
  summary,
  variant = 'info',
}: NotificationProps) {
  let color = sd.system.color.impression.tertiary
  if (variant === 'success') {
    color = sd.system.color.impression.positive
  } else if (variant === 'warning') {
    color = sd.system.color.impression.notice
  } else if (variant === 'error') {
    color = sd.system.color.impression.negative
  }

  let iconName: SymbolName = 'information'
  if (variant === 'success') {
    iconName = 'check-circle'
  } else if (variant === 'warning') {
    iconName = 'alert-triangle'
  } else if (variant === 'error') {
    iconName = 'alert-circle'
  }

  return (
    <div
      style={{
        padding: sd.system.dimension.spacing.large,
        borderRadius: sd.system.dimension.radius.medium,
        border: `1px solid ${color}`,
        // backgroundColor: color,
        marginTop: sd.system.dimension.spacing.medium,
        display: 'flex',
        alignItems: 'center',
        gap: sd.system.dimension.spacing.medium,
      }}
    >
      <SerendieSymbol
        name={iconName}
        style={{
          color,
          fontSize: '24px',
        }}
      />
      <div>
        <p
          style={{
            ...sd.system.typography.body.medium_expanded,
            color,
            margin: 0,
          }}
        >
          {summary}
        </p>
      </div>
    </div>
  )
}
