import { useState, useEffect } from 'react'
import { Button, Badge, Banner } from '@serendie/ui'
import tokens from '@serendie/design-token'
import {
  ColorValidationResult,
  ColorValidationIssue,
} from '../shared-src/models/ColorValidation'

const { sd } = tokens

// Plugin message types
type PluginMessage =
  | { type: 'lint-result'; result: ColorValidationResult; totalNodes: number }
  | { type: 'error'; message: string }

export default function App() {
  const [isLoading, setIsLoading] = useState(false)
  const [lintResult, setLintResult] = useState<ColorValidationResult | null>(
    null
  )
  const [error, setError] = useState<string | null>(null)
  const [totalNodes, setTotalNodes] = useState(0)

  useEffect(() => {
    // Listen for messages from plugin
    window.onmessage = (
      event: MessageEvent<{ pluginMessage: PluginMessage }>
    ) => {
      const message = event.data.pluginMessage

      if (message.type === 'lint-result') {
        setIsLoading(false)
        setLintResult(message.result)
        setTotalNodes(message.totalNodes)
        setError(null)
      } else if (message.type === 'error') {
        setIsLoading(false)
        setError(message.message)
        setLintResult(null)
      }
    }
  }, [])

  const handleRunLinter = () => {
    setIsLoading(true)
    setError(null)
    parent.postMessage(
      {
        pluginMessage: {
          type: 'run-linter',
        },
      },
      '*'
    )
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'red'
      case 'warning':
        return 'yellow'
      default:
        return 'gray'
    }
  }

  return (
    <div
      style={{
        padding: sd.system.dimension.spacing.threeExtraLarge,
        fontFamily: sd.reference.typography.fontFamily.primary,
      }}
    >
      <Button
        onClick={handleRunLinter}
        disabled={isLoading}
        style={{
          width: '100%',
          marginBottom: sd.system.dimension.spacing.twoExtraLarge,
        }}
        size='medium'
      >
        {isLoading ? 'Running...' : 'Run'}
      </Button>

      {error && (
        <Banner
          title='Error'
          description={error}
          style={{ marginBottom: sd.system.dimension.spacing.extraLarge }}
        />
      )}

      {lintResult && (
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: sd.system.dimension.spacing.medium,
              marginBottom: sd.system.dimension.spacing.large,
            }}
          >
            <h2
              style={{
                ...sd.system.typography.headline.small_expanded,
                color: sd.system.color.component.onSurface,
                margin: 0,
              }}
            >
              Results
            </h2>
            <Badge color={lintResult.isValid ? 'green' : 'red'} size='small'>
              {lintResult.isValid ? 'Valid' : 'Issues Found'}
            </Badge>
          </div>

          <div
            style={{
              marginBottom: sd.system.dimension.spacing.extraLarge,
            }}
          >
            <p
              style={{
                ...sd.system.typography.body.medium_expanded,
                color: sd.system.color.component.onSurface,
                margin: 0,
                marginBottom: sd.system.dimension.spacing.small,
              }}
            >
              <strong style={{ fontWeight: sd.reference.typography.fontWeight.bold }}>
                Total Text Nodes:
              </strong>{' '}
              {totalNodes}
            </p>
            <p
              style={{
                ...sd.system.typography.body.medium_expanded,
                color: sd.system.color.component.onSurface,
                margin: 0,
              }}
            >
              <strong style={{ fontWeight: sd.reference.typography.fontWeight.bold }}>
                Issues Found:
              </strong>{' '}
              {lintResult.totalIssues}
            </p>
          </div>

          {lintResult.issues.length > 0 && (
            <div style={{ marginTop: sd.system.dimension.spacing.extraLarge }}>
              <h3 style={{
                ...sd.system.typography.title.small_expanded,
                color: sd.system.color.component.onSurface,
                margin: 0,
                marginBottom: sd.system.dimension.spacing.medium,
              }}>
                Issues:
              </h3>
              <div style={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: sd.system.dimension.spacing.medium,
              }}>
                {lintResult.issues.map(
                  (issue: ColorValidationIssue, index: number) => (
                    <div key={index} style={{
                      padding: sd.system.dimension.spacing.medium,
                      borderRadius: sd.system.dimension.radius.medium,
                      border: `1px solid ${sd.system.color.component.outline}`,
                      backgroundColor: sd.system.color.component.surface,
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: sd.system.dimension.spacing.small,
                        marginBottom: sd.system.dimension.spacing.small,
                      }}>
                        <p style={{
                          ...sd.system.typography.label.medium_expanded,
                          color: sd.system.color.component.onSurface,
                          margin: 0,
                        }}>
                          {issue.nodeName}
                        </p>
                        <Badge
                          color={
                            getSeverityColor(issue.severity) as
                              | 'red'
                              | 'yellow'
                              | 'gray'
                          }
                          size='small'
                        >
                          {issue.severity}
                        </Badge>
                      </div>
                      <p style={{
                        ...sd.system.typography.body.small_expanded,
                        color: sd.system.color.component.onSurface,
                        margin: 0,
                        marginBottom: sd.system.dimension.spacing.small,
                      }}>
                        {issue.message}
                      </p>
                      <p style={{
                        ...sd.system.typography.body.small_expanded,
                        color: sd.system.color.component.onSurfaceVariant,
                        margin: 0,
                        marginBottom: sd.system.dimension.spacing.small,
                      }}>
                        💡 {issue.suggestion}
                      </p>
                      <div style={{
                        ...sd.system.typography.label.small_expanded,
                        display: 'flex',
                        gap: sd.system.dimension.spacing.medium,
                        color: sd.system.color.component.onSurfaceVariant,
                      }}>
                        <span>Text: {issue.textColor}</span>
                        <span>Background: {issue.backgroundColor}</span>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {lintResult.isValid && (
            <div style={{
              padding: sd.system.dimension.spacing.large,
              borderRadius: sd.system.dimension.radius.medium,
              border: `1px solid ${sd.system.color.component.outline}`,
              backgroundColor: sd.system.color.component.surface,
              marginTop: sd.system.dimension.spacing.medium,
              display: 'flex',
              alignItems: 'flex-start',
              gap: sd.system.dimension.spacing.medium,
            }}>
              <span style={{
                fontSize: '24px',
                color: sd.system.color.impression.positive,
              }}>✓</span>
              <div>
                <h3 style={{
                  ...sd.system.typography.title.small_expanded,
                  color: sd.system.color.component.onSurface,
                  margin: 0,
                  marginBottom: sd.system.dimension.spacing.small,
                }}>
                  Success
                </h3>
                <p style={{
                  ...sd.system.typography.body.medium_expanded,
                  color: sd.system.color.component.onSurface,
                  margin: 0,
                }}>
                  {lintResult.summary}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
