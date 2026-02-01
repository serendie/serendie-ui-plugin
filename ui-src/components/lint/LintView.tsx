import { useState, useCallback, useEffect, useRef } from 'react'
import { Button } from '@serendie/ui'
import tokens from '@serendie/design-token'
import IssuesList from './IssuesList'
import SelectionCard from './SelectionCard'
import ComponentValidationStatus from './ComponentValidationStatus'
import { SerendieSymbol } from '@serendie/symbols'
import {
  usePluginMessage,
  postPluginMessage,
} from '../../hooks/usePluginMessage'
import { PluginMessage, SelectionInfo } from '../../../shared-src/models/PluginMessage'
import { useLintResults } from '../../hooks/useLintResults'
import IssueTitle from './IssueTitle'

const { sd } = tokens

type LintPhase = 'selecting' | 'results'

interface LintViewProps {
  isActive: boolean
  onAnalyzingChange?: (isAnalyzing: boolean) => void
}

export default function LintView({
  isActive,
  onAnalyzingChange,
}: LintViewProps) {
  const [phase, setPhase] = useState<LintPhase>('selecting')
  const [selections, setSelections] = useState<SelectionInfo[]>([])
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({})
  const [selectionImages, setSelectionImages] = useState<
    Record<string, string>
  >({})

  const {
    results,
    isLoading,
    apiKey,
    componentValidationState,
    cancelComponentValidation,
    handleRunLinter,
    handleApplyComponents,
    handleApplyTokens,
    handleLintMessage,
    resetResults,
  } = useLintResults({
    selections,
    selectionImages,
    onPhaseChange: setPhase,
  })

  const allImagesLoaded =
    selections.length > 0 &&
    selections.every(selection => loadedImages[selection.id])

  const prevAnalyzingRef = useRef(false)
  useEffect(() => {
    const isAnalyzing = componentValidationState === 'analyzing'
    onAnalyzingChange?.(isAnalyzing)
    // 検証完了時に通知（他のタブを開いているときのみ）
    if (prevAnalyzingRef.current && !isAnalyzing && !isActive) {
      postPluginMessage({
        type: 'notify',
        message: 'コンポーネントの検証が完了しました',
      })
    }
    prevAnalyzingRef.current = isAnalyzing
  }, [componentValidationState, onAnalyzingChange, isActive])

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
      handleLintMessage(message)
    },
    [phase, handleLintMessage]
  )

  useEffect(() => {
    postPluginMessage({ type: 'request-selection' })
  }, [])

  usePluginMessage(handleMessage)

  const handleReselect = useCallback(() => {
    cancelComponentValidation()
    setPhase('selecting')
    resetResults()
    postPluginMessage({ type: 'request-selection' })
  }, [cancelComponentValidation, resetResults])

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
            pointerEvents: 'none',
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
                pointerEvents: 'auto',
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
          padding: `${sd.system.dimension.spacing.twoExtraLarge} ${sd.system.dimension.spacing.large}`,
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
                <>
                  {apiKey && (
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <IssueTitle title='コンポーネント' />
                        {componentValidationState === 'done' &&
                          result.issues.filter(
                            i =>
                              i.source === 'component' &&
                              i.severity !== 'resolved'
                          ).length > 0 && (
                            <Button
                              size='small'
                              styleType='ghost'
                              onClick={() => handleApplyComponents(result.id)}
                            >
                              適用する
                            </Button>
                          )}
                      </div>
                      {componentValidationState === 'analyzing' ? (
                        <ComponentValidationStatus />
                      ) : (
                        <IssuesList
                          issues={result.issues.filter(
                            issue => issue.source === 'component'
                          )}
                          totalItems={result.totalComponents ?? 0}
                          type='component'
                        />
                      )}
                    </div>
                  )}
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <IssueTitle title='デザイントークン' />
                      {result.issues.filter(
                        i =>
                          i.source === 'design-token' &&
                          i.severity !== 'resolved'
                      ).length > 0 && (
                        <Button
                          size='small'
                          styleType='ghost'
                          onClick={() => handleApplyTokens(result.id)}
                        >
                          修正する
                        </Button>
                      )}
                    </div>
                    <IssuesList
                      issues={result.issues.filter(
                        issue => issue.source !== 'component'
                      )}
                      totalItems={result.totalNodes}
                      type='token'
                    />
                  </div>
                </>
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
          pointerEvents: 'none',
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
            style={{ flex: 1, pointerEvents: 'auto' }}
            styleType={phase === 'selecting' ? 'filled' : 'outlined'}
          >
            {isLoading
              ? '検証中'
              : phase === 'selecting'
                ? !allImagesLoaded
                  ? '要素を選んでください'
                  : '検証する'
                : 'もう一度検証する'}
          </Button>
        </div>
      </div>
    </div>
  )
}
