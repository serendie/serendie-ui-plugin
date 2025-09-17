import tokens from '@serendie/design-token'
import { SerendieSymbol } from '@serendie/symbols'

import { Issue } from '../../shared-src/models/Rules'

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
            alignItems: 'center',
            gap: sd.system.dimension.spacing.medium,
            marginBottom: sd.system.dimension.spacing.medium,
          }}
        >
          <h3
            style={{
              ...sd.system.typography.title.small_expanded,
              color: sd.system.color.component.onSurface,
            }}
          >
            対象
          </h3>
          <p
            style={{
              ...sd.system.typography.body.small_expanded,
              color: sd.system.color.component.onSurfaceVariant,
            }}
          >
            "{targetName}"
          </p>
        </div>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: sd.system.dimension.spacing.medium,
          marginBottom: sd.system.dimension.spacing.medium,
        }}
      >
        <h3
          style={{
            ...sd.system.typography.title.small_expanded,
            color: sd.system.color.component.onSurface,
            margin: 0,
          }}
        >
          検証
        </h3>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: sd.system.dimension.spacing.twoExtraSmall,
          }}
        >
          <SerendieSymbol
            name={issues.length > 0 ? 'alert-circle' : 'check-circle'}
            variant='filled'
            size={18}
            style={{
              color:
                issues.length > 0
                  ? sd.system.color.impression.negative
                  : sd.system.color.impression.positive,
            }}
          />
          <p
            style={{
              ...sd.system.typography.body.small_expanded,
              color: sd.system.color.component.onSurfaceVariant,
            }}
          >
            {totalNodes - issues.length}/{totalNodes}
          </p>
        </div>
      </div>
    </>
  )
}
