import { useState, useEffect } from 'react'
import { Button } from '@serendie/ui'
import tokens from '@serendie/design-token'
import { Result } from '../shared-src/models/Rules'
import IssuesList from './components/IssuesList'
import Notification from './components/Notification'

const { sd } = tokens

type FrameResult = {
  frameName: string
  frameId: string
  result: Result
  totalNodes: number
}

type PluginMessage =
  | {
      type: 'lint-result'
      frameResults: FrameResult[]
    }
  | { type: 'error'; message: string }
  | {
      type: 'selection-changed'
      frameNames: string[]
    }

export default function App() {
  const [isLoading, setIsLoading] = useState(false)
  const [frameResults, setFrameResults] = useState<FrameResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedFrameNames, setSelectedFrameNames] = useState<string[]>([])

  useEffect(() => {
    window.onmessage = (
      event: MessageEvent<{ pluginMessage: PluginMessage }>
    ) => {
      const message = event.data.pluginMessage

      if (message.type === 'lint-result') {
        setIsLoading(false)
        setFrameResults(message.frameResults)
        setError(null)
      } else if (message.type === 'error') {
        setIsLoading(false)
        setError(message.message)
        setFrameResults([])
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
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: sd.reference.typography.fontFamily.primary,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: sd.system.dimension.spacing.large,
          padding: sd.system.dimension.spacing.threeExtraLarge,
          flexShrink: 0,
        }}
      >
        <Button
          onClick={handleRunLinter}
          disabled={
            isLoading ||
            selectedFrameNames.length === 0 ||
            JSON.stringify(selectedFrameNames) ===
              JSON.stringify(frameResults.map(({ frameName }) => frameName))
          }
          style={{
            width: '100%',
          }}
          size='medium'
        >
          {selectedFrameNames.length == 0
            ? '要素を選択してください'
            : '検証する'}
        </Button>
        {error && <Notification summary={error} variant='error' />}
      </div>

      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: sd.system.dimension.spacing.threeExtraLarge,
          paddingBottom: sd.system.dimension.spacing.threeExtraLarge,
          backgroundColor: sd.system.color.impression.tertiary,
        }}
      >
        {frameResults.length > 0 && (
          <div>
            {frameResults.map(frameResult => (
              <div
                key={frameResult.frameId}
                style={{
                  marginBottom: sd.system.dimension.spacing.twoExtraLarge,
                }}
              >
                <IssuesList
                  issues={frameResult.result.issues}
                  totalNodes={frameResult.totalNodes}
                  frameName={frameResult.frameName}
                />
                {frameResult.result.issues.length === 0 && (
                  <Notification
                    summary={'すべてのルールを満たしています'}
                    variant='success'
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
