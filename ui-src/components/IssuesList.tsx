import tokens from '@serendie/design-token'
import { Issue } from '../../shared-src/models/Rules'
import IssueListItem from './IssueListItem'
import IssueHeader from './IssueHeader'

const { sd } = tokens

interface IssuesListProps {
  issues: Issue[]
  totalNodes: number
  targetName?: string
}

export default function IssuesList({
  issues,
  totalNodes,
  targetName,
}: IssuesListProps) {
  return (
    <div>
      <IssueHeader
        issues={issues}
        totalNodes={totalNodes}
        targetName={targetName}
      />
      {issues.length > 0 && (
        <div
          style={{
            border: `1px solid ${sd.system.color.component.outline}`,
            borderRadius: sd.system.dimension.radius.medium,
            overflow: 'hidden',
            backgroundColor: sd.system.color.component.surface,
          }}
        >
          {issues.map((issue, index) => (
            <IssueListItem
              key={index}
              issue={issue}
              withBorder={index !== issues.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
