import tokens from '@serendie/design-token'

import { Issue } from '../../../shared-src/models/Rules'
import IssueListItem from './IssueListItem'
import IssueHeader from './IssueHeader'

const { sd } = tokens

export default function IssuesList({
  issues,
  totalItems,
  title,
}: {
  issues: Issue[]
  totalItems: number
  title?: string
}) {
  return (
    <div>
      <IssueHeader issues={issues} totalItems={totalItems} />
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
          {issues
            .filter(({ severity }) => severity === 'error')
            .map((issue, index) => (
              <IssueListItem
                key={`error-${index}`}
                issue={issue}
                withBorder={index !== issues.length - 1}
              />
            ))}
          {issues
            .filter(({ severity }) => severity === 'warning')
            .map((issue, index) => (
              <IssueListItem
                key={`warning-${index}`}
                issue={issue}
                withBorder={
                  index !==
                  issues.filter(issue => issue.severity === 'warning').length -
                    1
                }
              />
            ))}
        </div>
      )}
    </div>
  )
}
