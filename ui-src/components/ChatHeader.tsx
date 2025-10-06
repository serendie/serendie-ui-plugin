import { Button } from '@serendie/ui'
import tokens from '@serendie/design-token'
import { SerendieSymbol } from '@serendie/symbols'
import { Result } from '../App'

const { sd } = tokens

interface ChatHeaderProps {
  result: Result | null
  onBack: () => void
}

export default function ChatHeader({ result, onBack }: ChatHeaderProps) {
  return (
    <div
      style={{
        padding: sd.system.dimension.spacing.extraSmall,
      }}
    >
      <Button
        leftIcon={<SerendieSymbol name='chevron-left' />}
        size='small'
        styleType='ghost'
        onClick={onBack}
      >
        戻る
      </Button>
      <p
        style={{
          textAlign: 'center',
          ...sd.system.typography.label.medium_expanded,
          color: sd.system.color.component.onSurfaceVariant,
          position: 'absolute',
          top: 24,
          left: '50%',
          transform: 'translate(-50%, -50%)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '14em',
        }}
      >
        {result?.name}
      </p>
      <div style={{ width: 60 }} />
    </div>
  )
}
