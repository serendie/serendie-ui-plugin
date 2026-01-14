import tokens from '@serendie/design-token'
import { Button } from '@serendie/ui'
import { SerendieSymbol } from '@serendie/symbols'

const { sd } = tokens

interface ChatHeaderProps {
  title?: string
  onNewChat: () => void
  onOpenHistory: () => void
}

export default function ChatHeader({
  title,
  onNewChat,
  onOpenHistory,
}: ChatHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: sd.system.dimension.spacing.extraSmall,
        padding: `${sd.system.dimension.spacing.extraSmall} ${sd.system.dimension.spacing.twoExtraSmall}`,
        paddingLeft: sd.system.dimension.spacing.medium,
        backgroundColor: sd.system.color.component.surface,
        borderTop: `${sd.system.dimension.border.medium} solid ${sd.system.color.component.outlineBright}`,
        borderBottom: `${sd.system.dimension.border.medium} solid ${sd.system.color.component.outlineBright}`,
      }}
    >
      <span
        style={{
          ...sd.system.typography.label.medium_expanded,
          color: sd.system.color.component.onSurface,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1,
          minWidth: 0,
        }}
      >
        {title}
      </span>
      <div style={{ display: 'flex', flexShrink: 0 }}>
        <Button
          styleType='ghost'
          size='small'
          leftIcon={<SerendieSymbol name='chat-circle' />}
          onClick={onNewChat}
        >
          新規相談
        </Button>
        <Button
          styleType='ghost'
          size='small'
          leftIcon={<SerendieSymbol name='history' />}
          onClick={onOpenHistory}
        >
          履歴
        </Button>
      </div>
    </div>
  )
}
