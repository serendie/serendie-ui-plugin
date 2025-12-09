import { useState, useCallback, useEffect } from 'react'
import { Button } from '@serendie/ui'
import tokens from '@serendie/design-token'
import IssuesList from './IssuesList'
import SelectionCard from './SelectionCard'
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
        setSelections([])
        setLoadedImages({})
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
        height: '100%',
        position: 'relative',
        backgroundColor: sd.system.color.impression.tertiaryContainer,
      }}
    >
      <div
        style={{
          height: '100%',
          overflow: 'auto',
          padding: `${sd.system.dimension.spacing.twoExtraLarge} ${sd.system.dimension.spacing.extraLarge}`,
          paddingBottom: '7rem',
          display: 'flex',
          flexDirection: 'column',
          gap: sd.system.dimension.spacing.twoExtraLarge,
        }}
      >
        {phase === 'selecting' &&
          selections.map(selection => (
            <SelectionCard
              key={selection.id}
              selection={selection}
              onLoadComplete={handleImageLoadComplete}
            />
          ))}
        {phase === 'results' && results.length > 0 && (
          <div>
            {results.map((result, i) => (
              <div
                key={result.id}
                style={{
                  marginBottom:
                    i === results.length - 1
                      ? 0
                      : sd.system.dimension.spacing.twoExtraLarge,
                }}
              >
                <IssuesList
                  issues={result.issues}
                  totalNodes={result.totalNodes}
                  targetName={result.name}
                />
              </div>
            ))}
          </div>
        )}
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
          {phase === 'selecting' ? (
            <Button
              onClick={handleRunLinter}
              disabled={isLoading || !allImagesLoaded}
              style={{ flex: 1 }}
            >
              {isLoading ? '検証中' : '検証する'}
            </Button>
          ) : (
            <>
              <Button
                onClick={handleRunLinter}
                disabled={isLoading}
                style={{ flex: 1 }}
              >
                {isLoading ? '検証中' : '再検証'}
              </Button>
              <Button
                onClick={handleReselect}
                styleType='outlined'
                style={{ flex: 1 }}
              >
                要素を選び直す
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
