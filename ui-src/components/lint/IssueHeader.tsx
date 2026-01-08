import tokens from '@serendie/design-token'

import { Issue } from '../../../shared-src/models/Rules'
import StatLabel from './StatLabel'

const { sd } = tokens

export default function IssueHeader({
  issues,
  totalItems,
}: {
  issues: Issue[]
  totalItems: number
}) {
  const errorCount = issues.filter(issue => issue.severity === 'error').length
  const warningCount = issues.filter(
    issue => issue.severity === 'warning'
  ).length

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: sd.system.dimension.spacing.medium,
          marginBottom: sd.system.dimension.spacing.extraSmall,
          padding: sd.system.dimension.spacing.small,
          backgroundColor: sd.system.color.component.surface,
          borderRadius: sd.system.dimension.radius.medium,
          border: `1px solid ${sd.system.color.component.outline}`,
        }}
      >
        <StatLabel
          symbolName='check-circle'
          targetNodes={totalItems - issues.length}
          totalNodes={totalItems}
        />
        {errorCount > 0 && (
          <StatLabel
            symbolName='alert-circle'
            targetNodes={errorCount}
            totalNodes={totalItems}
          />
        )}
        {warningCount > 0 && (
          <StatLabel
            symbolName='alert-triangle'
            targetNodes={warningCount}
            totalNodes={totalItems}
          />
        )}
      </div>
    </>
  )
}
