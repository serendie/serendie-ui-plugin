import { useState, useEffect } from 'react'
import { Button, Banner } from '@serendie/ui'
import tokens from '@serendie/design-token'
import { Result } from '../shared-src/models/Rules'
import IssuesList from './components/IssuesList'
import SuccessBanner from './components/SuccessBanner'

const { sd } = tokens

// Plugin message types
type PluginMessage =
  | { type: 'lint-result'; result: Result; totalNodes: number }
  | { type: 'error'; message: string }

export default function App() {
  const [isLoading, setIsLoading] = useState(false)
  const [lintResult, setLintResult] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [totalNodes, setTotalNodes] = useState(0)

  useEffect(() => {
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
        {lintResult ? 'やり直す' : '実行'}
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
          <IssuesList issues={lintResult.issues} totalNodes={totalNodes} />
          {lintResult.issues.length === 0 && (
            <SuccessBanner
              summary={`✅ All ${totalNodes} text nodes have valid color relationships`}
            />
          )}
        </div>
      )}
    </div>
  )
}
