import { useState, useEffect } from 'react'
import { Button } from '@serendie/ui'
import tokens from '@serendie/design-token'
import { SerendieSymbol } from '@serendie/symbols'

import IssuesList from './components/IssuesList'
import Notification from './components/Notification'
import ChatView from './components/ChatView'
import SettingsDialog from './components/SettingsDialog'
import { Result } from './models/Result'

const { sd } = tokens

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
  const [selectionChanged, setSelectionChanged] = useState(true)
  const [currentView, setCurrentView] = useState<'main' | 'chat'>('main')
  const [selectedResult, setSelectedResult] = useState<Result | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    window.onmessage = (
      event: MessageEvent<{ pluginMessage: PluginMessage }>
    ) => {
      const message = event.data.pluginMessage

      if (message.type === 'lint-result') {
        setIsLoading(false)
        setResults(message.results)
        setSelectedResult(null)
        setError(null)
      }
      if (message.type === 'error') {
        setIsLoading(false)
        setError(message.message)
        setResults([])
      }
      if (message.type === 'selection-changed') {
        setSelections(message.selectionIds)
        setSelectionChanged(true)
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
    setSelectionChanged(false)
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
            flexDirection: 'row',
            gap: sd.system.dimension.spacing.medium,
            padding: sd.system.dimension.spacing.extraLarge,
            flexShrink: 0,
          }}
        >
          <Button
            onClick={handleRunLinter}
            disabled={isLoading || selections.length === 0 || !selectionChanged}
            style={{
              width: '100%',
              flex: 2,
            }}
            size='medium'
          >
            {selections.length == 0 ? '要素を選んでください' : '検証する'}
          </Button>
          <Button
            onClick={() => setSettingsOpen(true)}
            leftIcon={<SerendieSymbol name='gear' />}
            styleType='outlined'
            style={{
              width: '100%',
              flex: 1,
            }}
            size='medium'
          >
            設定
          </Button>
          {error && <Notification summary={error} variant='error' />}
        </div>
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: sd.system.dimension.spacing.extraLarge,
            paddingBottom: sd.system.dimension.spacing.threeExtraLarge,
            backgroundColor: sd.system.color.impression.tertiaryContainer,
          }}
        >
          {results.length > 0 && (
            <div>
              {results.map((result, i) => (
                <div
                  key={result.id}
                  style={{
                    marginBottom:
                      i == results.length - 1
                        ? 0
                        : sd.system.dimension.spacing.twoExtraLarge,
                  }}
                >
                  <IssuesList
                    issues={result.issues}
                    totalNodes={result.totalNodes}
                    targetName={result.name}
                    onOpenChat={() => handleOpenChat(result)}
                  />
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
      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  )
}
