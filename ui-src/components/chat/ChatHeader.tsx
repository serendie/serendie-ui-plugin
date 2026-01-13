import tokens from '@serendie/design-token'
import { Button } from '@serendie/ui'
import { SerendieSymbol } from '@serendie/symbols'

const { sd } = tokens

interface ChatHeaderProps {
  onNewChat: () => void
  onOpenHistory: () => void
}

export default function ChatHeader({
  onNewChat,
  onOpenHistory,
}: ChatHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: `${sd.system.dimension.spacing.extraSmall} ${sd.system.dimension.spacing.twoExtraSmall}`,
        paddingLeft: sd.system.dimension.spacing.medium,
        backgroundColor: sd.system.color.component.surface,
        borderTop: `${sd.system.dimension.border.medium} solid ${sd.system.color.component.outlineBright}`,
        borderBottom: `${sd.system.dimension.border.medium} solid ${sd.system.color.component.outlineBright}`,
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
      <Button
        styleType='ghost'
        size='small'
        leftIcon={<SerendieSymbol name='history' />}
        onClick={onOpenHistory}
      >
        履歴
      </Button>
    </div>
  )
}
