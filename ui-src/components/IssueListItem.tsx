import { useState } from 'react'
import tokens from '@serendie/design-token'
import { Issue } from '../../shared-src/models/Rules'
import { SerendieSymbol, SymbolName } from '@serendie/symbols'

const { sd } = tokens

interface IssueListItemProps {
  issue: Issue
  withBorder?: boolean
}

const getSeverityStyles = (severity: string) => {
  switch (severity) {
    case 'error':
      return {
        color: sd.system.color.impression.negative,
        name: 'alert-circle' as SymbolName,
      }
    case 'warning':
      return {
        color: sd.system.color.impression.notice,
        name: 'alert-triangle' as SymbolName,
      }
    default:
      return {
        color: sd.system.color.impression.positive,
        name: 'check-circle' as SymbolName,
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
        padding: sd.system.dimension.spacing.medium,
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
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: sd.system.dimension.spacing.twoExtraSmall,
          marginBottom: sd.system.dimension.spacing.extraSmall,
        }}
      >
        <SerendieSymbol
          name={severityStyles.name}
          style={{
            color: severityStyles.color,
            fontSize: '24px',
          }}
        />
        <p style={{ color: sd.system.color.component.onSurfaceVariant }}>
          "{issue.nodeName}"
        </p>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            ...sd.system.typography.body.medium_expanded,
            color: sd.system.color.component.onSurface,
            marginBottom: sd.system.dimension.spacing.twoExtraSmall,
          }}
        >
          {issue.message}
        </p>
        <p
          style={{
            ...sd.system.typography.label.small_expanded,
            color: sd.system.color.component.onSurfaceVariant,
            marginBottom: sd.system.dimension.spacing.twoExtraSmall,
          }}
        >
          {issue.suggestion}
        </p>
      </div>
    </div>
  )
}
