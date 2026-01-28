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
  // デザイントークン関連のissueのみカウント
  const tokenIssues = issues.filter(issue => issue.source === 'design-token')
  const tokenErrorCount = tokenIssues.filter(
    issue => issue.severity === 'error'
  ).length
  const tokenWarningCount = tokenIssues.filter(
    issue => issue.severity === 'warning'
  ).length

  // コンポーネント提案のカウント
  const componentCount = issues.filter(
    issue => issue.source === 'component'
  ).length

  return (
    <>
      {tokenIssues.length > 0 && (
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
            targetNodes={totalItems - tokenIssues.length}
            totalNodes={totalItems}
          />
          {tokenErrorCount > 0 && (
            <StatLabel
              symbolName='alert-circle'
              targetNodes={tokenErrorCount}
              totalNodes={totalItems}
            />
          )}
          {tokenWarningCount > 0 && (
            <StatLabel
              symbolName='alert-triangle'
              targetNodes={tokenWarningCount}
              totalNodes={totalItems}
            />
          )}
        </div>
      )}
      {componentCount > 0 && (
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
            symbolName='alert-triangle'
            targetNodes={componentCount}
            label='個のコンポーネントで利用可能'
          />
        </div>
      )}
    </>
  )
}
