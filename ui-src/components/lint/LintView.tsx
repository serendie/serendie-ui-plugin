import { useState, useCallback, useEffect, useRef } from 'react'
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
  LintResult,
  PluginMessage,
  SelectionInfo,
} from '../../../shared-src/models/PluginMessage'
import { useApiKey } from '../../hooks/useApiKey'
import { useComponentValidation } from '../../validations/useComponentValidation'

const { sd } = tokens

type LintPhase = 'selecting' | 'validating-components' | 'results'

interface LintViewProps {
  isActive: boolean
}

export default function LintView({ isActive }: LintViewProps) {
  const [phase, setPhase] = useState<LintPhase>('selecting')
  const [selections, setSelections] = useState<SelectionInfo[]>([])
  const [results, setResults] = useState<Result[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({})
  const [selectionImages, setSelectionImages] = useState<
    Record<string, string>
  >({})
  const pendingLintResultsRef = useRef<LintResult[] | null>(null)

  const { apiKey } = useApiKey()
  const { validate: validateComponents } = useComponentValidation({ apiKey })

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
      if (message.type === 'selection-images') {
        // 画像を保存（コンポーネント検証で使用）
        setSelectionImages(prev => {
          const next = { ...prev }
          for (const img of message.images) {
            if (img.image) {
              next[img.nodeId] = img.image
            }
          }
          return next
        })
      }
      if (message.type === 'lint-result' && message.source === 'lint-view') {
        // デザイントークン検証完了、コンポーネント検証を開始
        if (apiKey) {
          pendingLintResultsRef.current = message.results
          setPhase('validating-components')

          // 各結果に対してコンポーネント検証を実行
          const runComponentValidation = async () => {
            const updatedResults: Result[] = []
            for (const result of message.results) {
              const image = selectionImages[result.id]
              const componentResult = await validateComponents(
                result.structure,
                image
              )
              updatedResults.push({
                ...result,
                issues: [...result.issues, ...(componentResult?.issues || [])],
              })
            }
            setResults(updatedResults)
            setIsLoading(false)
            setPhase('results')
          }
          runComponentValidation()
        } else {
          // APIキーがない場合はデザイントークン検証のみ
          setIsLoading(false)
          setResults(message.results)
          setPhase('results')
        }
      }
    },
    [phase, apiKey, selectionImages, validateComponents]
  )

  useEffect(() => {
    postPluginMessage({ type: 'request-selection' })
  }, [])

  usePluginMessage(handleMessage)

  const handleRunLinter = useCallback(() => {
    setIsLoading(true)
    postPluginMessage({
      type: 'run-linter',
      nodeIds: selections.map(s => s.id),
      source: 'lint-view',
    })
  }, [selections])

  const handleReselect = useCallback(() => {
    setPhase('selecting')
    setResults([])
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
      {phase !== 'selecting' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            padding: `0 ${sd.system.dimension.spacing.medium}`,
            zIndex: 1,
          }}
        >
          <div
            style={{
              padding: `${sd.system.dimension.spacing.medium} 0`,
              background: `linear-gradient(${sd.system.color.impression.tertiaryContainer} 0%, transparent)`,
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
        </div>
      )}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: `${sd.system.dimension.spacing.twoExtraLarge} ${sd.system.dimension.spacing.extraLarge}`,
          paddingTop:
            phase !== 'selecting'
              ? '4rem'
              : sd.system.dimension.spacing.twoExtraLarge,
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
                isActive={isActive}
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
          left: `calc(${sd.system.dimension.spacing.extraSmall} * -1)`,
          right: `calc(${sd.system.dimension.spacing.extraSmall} * -1)`,
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
            styleType={phase === 'selecting' ? 'filled' : 'outlined'}
          >
            {isLoading
              ? '検証中'
              : phase === 'validating-components'
                ? 'コンポーネントを検証中'
                : phase === 'selecting'
                  ? '検証する'
                  : 'もう一度検証する'}
          </Button>
        </div>
      </div>
    </div>
  )
}
