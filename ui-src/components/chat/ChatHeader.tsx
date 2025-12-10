import tokens from '@serendie/design-token'
import { Button } from '@serendie/ui'
import { SerendieSymbol } from '@serendie/symbols'

const { sd } = tokens

interface ChatHeaderProps {
  onNewChat: () => void
}

export default function ChatHeader({ onNewChat }: ChatHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: `${sd.system.dimension.spacing.extraSmall} ${sd.system.dimension.spacing.twoExtraSmall}`,
        paddingLeft: sd.system.dimension.spacing.medium,
        backgroundColor: sd.system.color.component.surface,
        borderTop: `${sd.system.dimension.border.medium} solid ${sd.system.color.component.outline}`,
        borderBottom: `${sd.system.dimension.border.medium} solid ${sd.system.color.component.outline}`,
      }}
    >
      <Button
        styleType='ghost'
        size='small'
        leftIcon={<SerendieSymbol name='chat-circle' />}
        onClick={onNewChat}
      >
        新規相談
      </Button>
    </div>
  )
}
