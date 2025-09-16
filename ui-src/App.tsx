import { useState, useEffect } from 'react'
import { Button } from '@serendie/ui'
import tokens from '@serendie/design-token'
import { Result } from '../shared-src/models/Rules'
import IssuesList from './components/IssuesList'
import Notification from './components/Notification'

const { sd } = tokens

// Plugin message types
type PluginMessage =
  | {
      type: 'lint-result'
      result: Result
      totalNodes: number
      frameName: string
    }
  | { type: 'error'; message: string }
  | {
      type: 'selection-changed'
      frameNames: string[]
    }

export default function App() {
  const [isLoading, setIsLoading] = useState(false)
  const [lintResult, setLintResult] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [totalNodes, setTotalNodes] = useState(0)
  const [frameName, setFrameName] = useState<string>('')
  const [selectedFrameNames, setSelectedFrameNames] = useState<string[]>([])

  useEffect(() => {
    window.onmessage = (
      event: MessageEvent<{ pluginMessage: PluginMessage }>
    ) => {
      const message = event.data.pluginMessage

      if (message.type === 'lint-result') {
        setIsLoading(false)
        setLintResult(message.result)
        setTotalNodes(message.totalNodes)
        setFrameName(message.frameName)
        setError(null)
      } else if (message.type === 'error') {
        setIsLoading(false)
        setError(message.message)
        setLintResult(null)
      } else if (message.type === 'selection-changed') {
        setSelectedFrameNames(message.frameNames)
      }
    }

    // UIが準備できたら、初期の選択状態をリクエスト
    parent.postMessage(
      {
        pluginMessage: {
          type: 'request-selection',
        },
      },
      '*'
    )
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
        display: 'flex',
        flexDirection: 'column',
        gap: sd.system.dimension.spacing.large,
      }}
    >
      <Notification
        summary={`${selectedFrameNames.length}個のフレームを選択中`}
      />
      <Button
        onClick={handleRunLinter}
        disabled={isLoading || selectedFrameNames.length === 0}
        style={{
          width: '100%',
        }}
        size='medium'
      >
        実行
      </Button>

      {error && <Notification summary={error} variant='error' />}

      {lintResult && (
        <div>
          <IssuesList
            issues={lintResult.issues}
            totalNodes={totalNodes}
            frameName={frameName}
          />
          {lintResult.issues.length === 0 && (
            <Notification
              summary='すべてのルールを満たしています。'
              variant='success'
            />
          )}
        </div>
      )}
    </div>
  )
}
