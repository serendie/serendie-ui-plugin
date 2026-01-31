import { useState, useCallback, useEffect, useRef } from 'react'
import { Button } from '@serendie/ui'
import tokens from '@serendie/design-token'
import IssuesList from './IssuesList'
import SelectionCard from './SelectionCard'
import ComponentValidationStatus from './ComponentValidationStatus'
import { SerendieSymbol } from '@serendie/symbols'
import { Result } from '../../models/Result'
import {
  usePluginMessage,
  postPluginMessage,
} from '../../hooks/usePluginMessage'
import {
  ApplyComponentItem,
  LintResult,
  PluginMessage,
  SelectionInfo,
} from '../../../shared-src/models/PluginMessage'
import { ComponentIssue } from '../../../shared-src/models/Rules'
import { useApiKey } from '../../hooks/useApiKey'
import { useComponentValidation } from '../../hooks/useComponentValidation'
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
  const [results, setResults] = useState<Result[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({})
  const [selectionImages, setSelectionImages] = useState<
    Record<string, string>
  >({})
  const pendingLintResultsRef = useRef<LintResult[] | null>(null)

  const { apiKey } = useApiKey()
  const {
    state: componentValidationState,
    validate: validateComponents,
    cancel: cancelComponentValidation,
  } = useComponentValidation({ apiKey })

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
      if (message.type === 'apply-components-result') {
        setResults(prev =>
          prev.map(result => {
            if (result.id !== message.rootNodeId) return result
            const updatedIssues = result.issues.map(issue => {
              if (issue.source !== 'component') return issue
              const applied = message.results.find(
                r => r.oldNodeId === issue.nodeId
              )
              if (!applied || applied.status !== 'success') return issue
              return {
                ...issue,
                severity: 'resolved' as const,
                nodeId: applied.newNodeId,
                message: `${issue.suggestion.componentName}を適用しました`,
                messageDetails: null,
              }
            })
            return { ...result, issues: updatedIssues }
          })
        )
      }
      if (message.type === 'lint-result' && message.source === 'lint-view') {
        // デザイントークン検証完了、まず結果を表示
        setIsLoading(false)
        setResults(message.results)
        setPhase('results')

        // APIキーがあればコンポーネント検証を裏で実行
        if (apiKey) {
          pendingLintResultsRef.current = message.results
          const runComponentValidation = async () => {
            const updatedResults: Result[] = []
            for (const result of message.results) {
              const image = selectionImages[result.id]
              const componentResult = await validateComponents(
                result.structure,
                image
              )
              // キャンセルされた場合はループを中断
              if (componentResult === null) {
                return
              }
              updatedResults.push({
                ...result,
                issues: [...result.issues, ...(componentResult?.issues || [])],
                totalComponents:
                  componentResult?.candidates.filter(
                    c => c.suggestedComponent !== null
                  ).length ?? 0,
              })
            }
            // コンポーネント検証完了後に結果を更新
            setResults(updatedResults)
          }
          runComponentValidation()
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
    cancelComponentValidation()
    setPhase('selecting')
    setResults([])
    postPluginMessage({ type: 'request-selection' })
  }, [cancelComponentValidation])

  const handleImageLoadComplete = useCallback((nodeId: string) => {
    setLoadedImages(prev => ({ ...prev, [nodeId]: true }))
  }, [])

  // コンポーネントの適用ハンドラ
  const handleApplyComponents = useCallback(
    (rootNodeId: string) => {
      const result = results.find(r => r.id === rootNodeId)
      if (!result) return

      const items: ApplyComponentItem[] = []
      const componentIssues = result.issues.filter(
        (issue): issue is ComponentIssue =>
          issue.source === 'component' && issue.severity !== 'resolved'
      )
      for (const issue of componentIssues) {
        items.push({
          nodeId: issue.nodeId,
          ...issue.suggestion,
        })
      }
      if (items.length > 0) {
        postPluginMessage({ type: 'apply-components', rootNodeId, items })
      }
    },
    [results]
  )

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
                    <IssueTitle title='デザイントークン' />
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
