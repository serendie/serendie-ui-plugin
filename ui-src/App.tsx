import { useState, useEffect } from 'react'
import { IconButton, TabItem, Tabs } from '@serendie/ui'
import tokens from '@serendie/design-token'
import { SerendieSymbol } from '@serendie/symbols'

import LintView from './components/lint/LintView'
import ChatView from './components/chat/ChatView'
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
  const [currentView, setCurrentView] = useState<'chat' | 'lint'>('chat')
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
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingRight: sd.system.dimension.spacing.small,
        }}
      >
        <Tabs
          defaultValue='chat'
          style={{ width: '15rem' }}
          onValueChange={details =>
            setCurrentView(details.value as 'chat' | 'lint')
          }
        >
          <TabItem title='相談する' value='chat' />
          <TabItem title='検証する' value='lint' />
        </Tabs>
        <IconButton
          icon={<SerendieSymbol name='gear' />}
          onClick={() => setSettingsOpen(true)}
          shape='rectangle'
          styleType='ghost'
          size='small'
        />
      </div>
      <div style={{ flex: 1, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            transform: `translateX(${currentView === 'lint' ? '-100%' : '0'})`,
            transition: 'transform 0.3s ease-in-out',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <ChatView result={selectedResult} />
        </div>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            transform: `translateX(${currentView === 'lint' ? '0' : '100%'})`,
            transition: 'transform 0.3s ease-in-out',
          }}
        >
          <LintView results={results} />
        </div>
      </div>
      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  )
}
