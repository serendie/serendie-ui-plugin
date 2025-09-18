import { Button, TextField } from '@serendie/ui'
import tokens from '@serendie/design-token'
import { SerendieSymbol } from '@serendie/symbols'

import { Result } from '../App'

const { sd } = tokens

interface ChatViewProps {
  result: Result | null
  onBack: () => void
}

export default function ChatView({ result, onBack }: ChatViewProps) {
  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: sd.reference.typography.fontFamily.primary,
        backgroundColor: sd.system.color.impression.tertiary,
      }}
    >
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
          }}
        >
          {result?.name}
        </p>
        <div style={{ width: 60 }} />
      </div>
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: sd.system.dimension.spacing.threeExtraLarge,
        }}
      >
        <div
          style={{
            ...sd.system.typography.body.large_expanded,
            color: sd.system.color.component.onSurfaceVariant,
            textAlign: 'center',
            marginTop: sd.system.dimension.spacing.fourExtraLarge,
          }}
        >
          チャット機能は準備中です
        </div>
        <div
          style={{
            ...sd.system.typography.body.medium_expanded,
            color: sd.system.color.component.onSurfaceVariant,
            textAlign: 'center',
            marginTop: sd.system.dimension.spacing.large,
          }}
        >
          検証結果: {result?.issues.length ?? 0}件のissue
        </div>
      </div>
      <div
        style={{
          padding: sd.system.dimension.spacing.large,
          display: 'flex',
          gap: sd.system.dimension.spacing.medium,
          alignItems: 'center',
        }}
      >
        <TextField placeholder='メッセージを入力' style={{ flex: 1 }} />
        <Button style={{ flexShrink: 0 }}>送信</Button>
      </div>
    </div>
  )
}
