import { useState } from 'react'
import tokens from '@serendie/design-token'
import { Issue } from '../../shared-src/models/Rules'

const { sd } = tokens

interface IssueListItemProps {
  issue: Issue
  withBorder?: boolean
}

const getSeverityStyles = (severity: string) => {
  switch (severity) {
    case 'error':
      return {
        backgroundColor: sd.system.color.impression.negativeContainer,
        color: sd.system.color.impression.onNegativeContainer,
        label: 'エラー',
      }
    case 'warning':
      return {
        backgroundColor: sd.system.color.impression.noticeContainer,
        color: sd.system.color.impression.onNoticeContainer,
        label: '警告',
      }
    default:
      return {
        backgroundColor: sd.system.color.component.surface,
        color: sd.system.color.component.onSurfaceVariant,
        label: '情報',
      }
  }
}

export default function IssueListItem({
  issue,
  withBorder = true,
}: IssueListItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  const severityStyles = getSeverityStyles(issue.severity)

  const handleClick = () => {
    // Send message to plugin to select and scroll to node
    parent.postMessage(
      {
        pluginMessage: {
          type: 'select-node',
          nodeId: issue.nodeId,
        },
      },
      '*'
    )
  }

  return (
    <div
      onClick={handleClick}
      style={{
        padding: sd.system.dimension.spacing.small,
        ...(withBorder && {
          borderBottom: `1px solid ${sd.system.color.component.outline}`,
        }),
        backgroundColor: isHovered
          ? sd.system.color.interaction.hovered
          : sd.system.color.component.surface,
        cursor: 'pointer',
        transition: 'background-color 0.2s',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        style={{
          ...sd.system.typography.label.small_expanded,
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          gap: sd.system.dimension.spacing.twoExtraSmall,
          marginBottom: sd.system.dimension.spacing.extraSmall,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '60px',
            ...sd.system.typography.label.small_expanded,
            padding: `${sd.system.dimension.spacing.twoExtraSmall} 0`,
            borderRadius: sd.system.dimension.radius.full,
            backgroundColor: severityStyles.backgroundColor,
            color: severityStyles.color,
            flexShrink: 0,
          }}
        >
          {severityStyles.label}
        </div>
        <p style={{ color: sd.system.color.component.onSurfaceVariant }}>
          {issue.nodeType}: "{issue.nodeName}"
        </p>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            ...sd.system.typography.body.small_expanded,
            color: sd.system.color.component.onSurface,
            marginBottom: sd.system.dimension.spacing.twoExtraSmall,
          }}
        >
          {issue.message}
        </div>
        <div
          style={{
            ...sd.system.typography.label.small_expanded,
            color: sd.system.color.component.onSurfaceVariant,
          }}
        >
          {issue.suggestion}
        </div>
      </div>
    </div>
  )
}
