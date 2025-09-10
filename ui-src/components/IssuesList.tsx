import tokens from '@serendie/design-token'
import { Issue } from '../../shared-src/models/Rules'
import IssueListItem from './IssueListItem'

const { sd } = tokens

interface IssuesListProps {
  issues: Issue[]
  totalNodes: number
}

export default function IssuesList({ issues, totalNodes }: IssuesListProps) {
  return (
    <div style={{ marginTop: sd.system.dimension.spacing.large }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
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
          検証結果
        </h3>
        <div
          style={{
            ...sd.system.typography.body.small_expanded,
            color: sd.system.color.component.onSurfaceVariant,
          }}
        >
          {issues.length}件 / {totalNodes}件
        </div>
      </div>

      {/* Issues list */}
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
