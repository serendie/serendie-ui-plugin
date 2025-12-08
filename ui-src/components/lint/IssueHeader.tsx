import tokens from '@serendie/design-token'
import { SerendieSymbol } from '@serendie/symbols'
import { Button } from '@serendie/ui'

import { Issue } from '../../../shared-src/models/Rules'
import StatLabel from './StatLabel'

const { sd } = tokens

export default function IssueHeader({
  issues,
  targetName,
  totalNodes,
}: {
  issues: Issue[]
  targetName?: string
  totalNodes: number
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
            marginLeft: sd.system.dimension.radius.medium,
          }}
        >
          <h3
            style={{
              ...sd.system.typography.title.small_expanded,
              color: sd.system.color.component.onSurface,
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
            }}
          >
            {targetName}
          </h3>
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
        {issues.filter(issue => issue.severity === 'error').length > 0 && (
          <StatLabel
            symbolName='alert-circle'
            targetNodes={
              issues.filter(issue => issue.severity === 'error').length
            }
            totalNodes={totalNodes}
          />
        )}
        {issues.filter(issue => issue.severity === 'warning').length > 0 && (
          <StatLabel
            symbolName='alert-triangle'
            targetNodes={
              issues.filter(issue => issue.severity === 'warning').length
            }
            totalNodes={totalNodes}
          />
        )}
      </div>
    </>
  )
}
