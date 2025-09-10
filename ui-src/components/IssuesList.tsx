import tokens from '@serendie/design-token'
import { Issue } from '../../shared-src/models/Rules'
import IssueListItem from './IssueListItem'
import { SerendieSymbol } from '@serendie/symbols'

const { sd } = tokens

interface IssuesListProps {
  issues: Issue[]
  totalNodes: number
  frameName?: string
}

export default function IssuesList({
  issues,
  totalNodes,
  frameName,
}: IssuesListProps) {
  return (
    <div style={{ marginTop: sd.system.dimension.spacing.large }}>
      {frameName && (
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
            "{frameName}"
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
            name='check-circle'
            variant='filled'
            size={16}
            style={{
              color: sd.system.color.impression.positive,
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
