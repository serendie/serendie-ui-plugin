import tokens from '@serendie/design-token'
import { SerendieSymbol } from '@serendie/symbols'

import { Issue } from '../../shared-src/models/Rules'
import { Button } from '@serendie/ui'
import StatLabel from './StatLabel'

const { sd } = tokens

export default function IssueHeader({
  issues,
  targetName,
  totalNodes,
  onOpenChat,
}: {
  issues: Issue[]
  targetName?: string
  totalNodes: number
  onOpenChat: () => void
}) {
  return (
    <>
      {targetName && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: sd.system.dimension.spacing.small,
            marginBottom: sd.system.dimension.spacing.medium,
            marginLeft: sd.system.dimension.spacing.extraSmall,
          }}
        >
          <h3
            style={{
              ...sd.system.typography.title.small_expanded,
              color: sd.system.color.component.onSurface,
              wordBreak: 'keep-all',
              overflowWrap: 'break-word',
            }}
          >
            {targetName}
          </h3>
          <div
            style={{
              flexShrink: 0,
            }}
          >
            <Button
              rightIcon={<SerendieSymbol name='chevron-right' />}
              styleType='ghost'
              size='small'
              onClick={onOpenChat}
            >
              AIに相談する
            </Button>
          </div>
        </div>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: sd.system.dimension.spacing.medium,
          marginBottom: sd.system.dimension.spacing.small,
          padding: sd.system.dimension.spacing.small,
          backgroundColor: sd.system.color.component.surface,
          borderRadius: sd.system.dimension.radius.medium,
          border: `1px solid ${sd.system.color.component.outline}`,
        }}
      >
        <StatLabel
          symbolName='check-circle'
          targetNodes={totalNodes - issues.length}
          totalNodes={totalNodes}
        />
        {issues.filter(issue => issue.severity === 'warning').length > 0 && (
          <StatLabel
            symbolName='alert-triangle'
            targetNodes={
              issues.filter(issue => issue.severity === 'warning').length
            }
            totalNodes={totalNodes}
          />
        )}
        {issues.filter(issue => issue.severity === 'error').length > 0 && (
          <StatLabel
            symbolName='alert-circle'
            targetNodes={
              issues.filter(issue => issue.severity === 'error').length
            }
            totalNodes={totalNodes}
          />
        )}
      </div>
    </>
  )
}
