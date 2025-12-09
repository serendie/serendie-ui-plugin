import { useState, useCallback, useEffect } from 'react'
import { Button } from '@serendie/ui'
import tokens from '@serendie/design-token'
import IssuesList from './IssuesList'
import SelectionCard from './SelectionCard'
import { SerendieSymbol } from '@serendie/symbols'
import { Result } from '../../models/Result'
import {
  usePluginMessage,
  postPluginMessage,
} from '../../hooks/usePluginMessage'
import {
  PluginMessage,
  SelectionInfo,
} from '../../../shared-src/models/PluginMessage'

const { sd } = tokens

type LintPhase = 'selecting' | 'results'

export default function LintView() {
  const [phase, setPhase] = useState<LintPhase>('selecting')
  const [selections, setSelections] = useState<SelectionInfo[]>([])
  const [results, setResults] = useState<Result[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({})

  const allImagesLoaded =
    selections.length > 0 &&
    selections.every(selection => loadedImages[selection.id])

  const handleMessage = useCallback(
    (message: PluginMessage) => {
      if (message.type === 'selection-changed' && phase === 'selecting') {
        setSelections(message.selections)
        const newIds = message.selections.map(s => s.id)
        setLoadedImages(prev => {
          const next: Record<string, boolean> = {}
          newIds.forEach(newId => {
            next[newId] = prev[newId] || false
          })
          return next
        })
      }
      if (message.type === 'lint-result') {
        setIsLoading(false)
        setResults(message.results)
        setPhase('results')
      }
    },
    [phase]
  )

  useEffect(() => {
    postPluginMessage({ type: 'request-selection' })
  }, [])

  usePluginMessage(handleMessage)

  const handleRunLinter = useCallback(() => {
    setIsLoading(true)
    postPluginMessage({ type: 'run-linter' })
  }, [])

  const handleReselect = useCallback(() => {
    setPhase('selecting')
    setResults([])
    setLoadedImages({})
    postPluginMessage({ type: 'request-selection' })
  }, [])

  const handleImageLoadComplete = useCallback((nodeId: string) => {
    setLoadedImages(prev => ({ ...prev, [nodeId]: true }))
  }, [])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
        backgroundColor: sd.system.color.impression.tertiaryContainer,
      }}
    >
      {phase === 'results' && (
        <div
          style={{
            padding: sd.system.dimension.spacing.medium,
            paddingBottom: 0,
          }}
        >
          <Button
            leftIcon={<SerendieSymbol name='chevron-left' />}
            styleType='ghost'
            size='small'
            onClick={handleReselect}
            style={{
              width: 'fit-content',
            }}
          >
            戻る
          </Button>
        </div>
      )}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: `${sd.system.dimension.spacing.twoExtraLarge} ${sd.system.dimension.spacing.extraLarge}`,
          paddingBottom: '7rem',
          display: 'flex',
          flexDirection: 'column',
          gap: sd.system.dimension.spacing.twoExtraLarge,
        }}
      >
        {selections.map(selection => {
          const result = results.find(r => r.id === selection.id)
          return (
            <div
              key={selection.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: sd.system.dimension.spacing.medium,
              }}
            >
              <SelectionCard
                selection={selection}
                onLoadComplete={handleImageLoadComplete}
              />
              {phase === 'results' && result && (
                <IssuesList
                  issues={result.issues}
                  totalNodes={result.totalNodes}
                />
              )}
            </div>
          )
        })}
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: `0 ${sd.system.dimension.spacing.large}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: sd.system.dimension.spacing.small,
            width: '100%',
            padding: `${sd.system.dimension.spacing.large} 0`,
            background: `linear-gradient(transparent, ${sd.system.color.impression.tertiaryContainer} 100%)`,
          }}
        >
          <Button
            onClick={handleRunLinter}
            disabled={isLoading || !allImagesLoaded}
            style={{ flex: 1 }}
          >
            {isLoading
              ? '検証中'
              : phase === 'selecting'
                ? '検証する'
                : 'もう一度検証する'}
          </Button>
        </div>
      </div>
    </div>
  )
}
