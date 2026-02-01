import tokens from '@serendie/design-token'

import { Issue } from '../../../shared-src/models/Rules'
import IssueListItem from './IssueListItem'
import TokenIssueHeader from './TokenIssueHeader'
import ComponentIssueHeader from './ComponentIssueHeader'

const { sd } = tokens

export default function IssuesList({
  issues,
  totalItems,
  type,
}: {
  issues: Issue[]
  totalItems: number
  type: 'token' | 'component'
}) {
  return (
    <div>
      {type === 'token' ? (
        <TokenIssueHeader issues={issues} totalItems={totalItems} />
      ) : (
        <ComponentIssueHeader
          count={issues.length}
          resolvedCount={
            issues.filter(i => i.severity === 'resolved').length
          }
        />
      )}
      {issues.length > 0 && (
        <div
          style={{
            border: `1px solid ${sd.system.color.component.outline}`,
            borderRadius: sd.system.dimension.radius.medium,
            backgroundColor: sd.system.color.component.surface,
            maxHeight: 200,
            overflowY: 'scroll',
          }}
        >
          {(() => {
            const sorted = [
              ...issues.filter(({ severity }) => severity === 'error'),
              ...issues.filter(({ severity }) => severity === 'warning'),
              ...issues.filter(({ severity }) => severity === 'resolved'),
            ]
            return sorted.map((issue, index) => (
              <IssueListItem
                key={`${issue.severity}-${index}`}
                issue={issue}
                withBorder={index !== sorted.length - 1}
              />
            ))
          })()}
        </div>
      )}
    </div>
  )
}
