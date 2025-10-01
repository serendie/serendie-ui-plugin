import tokens from '@serendie/design-token'
import { Button } from '@serendie/ui'
import { SerendieSymbol } from '@serendie/symbols'

import { Issue } from '../../shared-src/models/Rules'
import IssueListItem from './IssueListItem'
import IssueHeader from './IssueHeader'

const { sd } = tokens

export default function IssuesList({
  issues,
  totalNodes,
  targetName,
  onOpenChat,
}: {
  issues: Issue[]
  totalNodes: number
  targetName?: string
  onOpenChat: () => void
}) {
  return (
    <div>
      <IssueHeader
        issues={issues}
        totalNodes={totalNodes}
        targetName={targetName}
        onOpenChat={onOpenChat}
      />
      {issues.length > 0 && (
        <div
          style={{
            border: `1px solid ${sd.system.color.component.outline}`,
            borderRadius: sd.system.dimension.radius.medium,
            backgroundColor: sd.system.color.component.surface,
            maxHeight: 400,
            overflowY: 'scroll',
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
