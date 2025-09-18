import { useState, useEffect } from 'react'
import { Button } from '@serendie/ui'
import tokens from '@serendie/design-token'
import { SerendieSymbol } from '@serendie/symbols'

import IssuesList from './components/IssuesList'
import Notification from './components/Notification'
import ChatView from './components/ChatView'
import { Issue } from '../shared-src/models/Rules'

const { sd } = tokens

export type Result = {
  name: string
  id: string
  issues: Issue[]
  totalNodes: number
}

type PluginMessage =
  | {
      type: 'lint-result'
      results: Result[]
    }
  | { type: 'error'; message: string }
  | {
      type: 'selection-changed'
      selectionIds: string[]
    }

export default function App() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<Result[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selections, setSelections] = useState<string[]>([])
  const [currentView, setCurrentView] = useState<'main' | 'chat'>('main')
  const [selectedResult, setSelectedResult] = useState<Result | null>(null)

  useEffect(() => {
    window.onmessage = (
      event: MessageEvent<{ pluginMessage: PluginMessage }>
    ) => {
      const message = event.data.pluginMessage

      if (message.type === 'lint-result') {
        setIsLoading(false)
        setResults(message.results)
        setError(null)
      } else if (message.type === 'error') {
        setIsLoading(false)
        setError(message.message)
        setResults([])
      } else if (message.type === 'selection-changed') {
        setSelections(message.selectionIds)
      }
    }
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
  const handleOpenChat = (result: Result) => {
    setSelectedResult(result)
    setCurrentView('chat')
  }
  const handleBackToMain = () => {
    setCurrentView('main')
    setSelectedResult(null)
  }

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: sd.reference.typography.fontFamily.primary,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          transform: `translateX(${currentView === 'chat' ? '-100%' : '0'})`,
          transition: 'transform 0.3s ease-in-out',
          display: 'flex',
          flexDirection: 'column',
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
              selections.length === 0 ||
              JSON.stringify(selections) ===
                JSON.stringify(results.map(({ id }) => id))
            }
            style={{
              width: '100%',
            }}
            size='medium'
          >
            {selections.length == 0 ? '要素を選択してください' : '検証する'}
          </Button>
          {error && <Notification summary={error} variant='error' />}
        </div>

        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: sd.system.dimension.spacing.threeExtraLarge,
            paddingBottom: sd.system.dimension.spacing.threeExtraLarge,
            backgroundColor: sd.system.color.impression.tertiaryContainer,
          }}
        >
          {results.length > 0 && (
            <div>
              {results.map(result => (
                <div
                  key={result.id}
                  style={{
                    marginBottom: sd.system.dimension.spacing.twoExtraLarge,
                  }}
                >
                  <IssuesList
                    issues={result.issues}
                    totalNodes={result.totalNodes}
                    targetName={result.name}
                  />
                  {result.issues.length === 0 && (
                    <Notification
                      summary={'すべてのルールを満たしています'}
                      variant='success'
                    />
                  )}
                  <div
                    style={{
                      textAlign: 'right',
                      marginTop: sd.system.dimension.spacing.extraSmall,
                    }}
                  >
                    <Button
                      rightIcon={<SerendieSymbol name='chevron-right' />}
                      styleType='ghost'
                      size='small'
                      onClick={() => handleOpenChat(result)}
                    >
                      AIに相談する
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          transform: `translateX(${currentView === 'chat' ? '0' : '100%'})`,
          transition: 'transform 0.3s ease-in-out',
        }}
      >
        <ChatView result={selectedResult} onBack={handleBackToMain} />
      </div>
    </div>
  )
}
