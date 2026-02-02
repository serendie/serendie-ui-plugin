import { useState, useCallback } from 'react'
import { Result } from '../models/Result'
import { postPluginMessage } from './usePluginMessage'
import {
  BorderTokenToFix,
  ComponentToFix,
  ColorTokenToFix,
  ApplyTokenResult,
  PluginMessage,
  SelectionInfo,
} from '../../shared-src/models/PluginMessage'
import {
  ComponentIssue,
  DesignTokenIssue,
  Issue,
} from '../../shared-src/models/Rules'
import { useApiKey } from './useApiKey'
import { useComponentValidation } from './useComponentValidation'

const BORDER_ISSUE_MESSAGES = ['線色', '線幅', '角丸']

function extractRoleName(fullPath: string): string {
  return fullPath.split('/').pop() ?? fullPath
}

function formatBorderResolvedMessage(
  issueMessage: string,
  appliedResults: ApplyTokenResult[]
): string {
  // issue のメッセージからプロパティ種別を判定し、対応する result を選択
  const label = issueMessage.includes('線幅')
    ? '線幅'
    : issueMessage.includes('角丸')
      ? '角丸'
      : '線色'

  const pathKeyword = issueMessage.includes('線幅')
    ? 'border/'
    : issueMessage.includes('角丸')
      ? 'radius/'
      : ''

  const matched = pathKeyword
    ? appliedResults.find(r => {
        const roles = Array.isArray(r.appliedRole)
          ? r.appliedRole
          : r.appliedRole
            ? [r.appliedRole]
            : []
        return roles.some(role => role.includes(pathKeyword))
      })
    : appliedResults.find(r => {
        const roles = Array.isArray(r.appliedRole)
          ? r.appliedRole
          : r.appliedRole
            ? [r.appliedRole]
            : []
        return roles.some(
          role => !role.includes('border/') && !role.includes('radius/')
        )
      })

  if (!matched?.appliedRole) return '修正しました'

  const roles = Array.isArray(matched.appliedRole)
    ? matched.appliedRole
    : [matched.appliedRole]

  const uniqueRoles = [...new Set(roles.map(extractRoleName))]
  const rolesText = uniqueRoles.map(r => `「${r}」`).join('')
  return `${label}を${rolesText}で修正しました`
}

function isBorderIssue(issue: DesignTokenIssue): boolean {
  return BORDER_ISSUE_MESSAGES.some(m => issue.message.includes(m))
}

export function useLintResults({
  selections,
  selectionImages,
  onPhaseChange,
}: {
  selections: SelectionInfo[]
  selectionImages: Record<string, string>
  onPhaseChange: (phase: 'results') => void
}) {
  const [results, setResults] = useState<Result[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [applyingTokenNodeIds, setApplyingTokenNodeIds] = useState<Set<string>>(
    new Set()
  )
  const [applyingComponentNodeIds, setApplyingComponentNodeIds] = useState<
    Set<string>
  >(new Set())
  const [imageRefreshKey, setImageRefreshKey] = useState(0)
  const [isRelinting, setIsRelinting] = useState(false)
  const { apiKey } = useApiKey()
  const {
    state: componentValidationState,
    validate: validateComponents,
    cancel: cancelComponentValidation,
  } = useComponentValidation({ apiKey })

  const handleLintMessage = useCallback(
    (message: PluginMessage) => {
      if (message.type === 'apply-components-result') {
        setApplyingComponentNodeIds(prev => {
          const next = new Set(prev)
          next.delete(message.rootNodeId)
          return next
        })
        setImageRefreshKey(k => k + 1)
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

        // 成功した適用がある場合、デザイントークン検証を再実施
        const hasSuccess = message.results.some(r => r.status === 'success')
        if (hasSuccess) {
          setIsRelinting(true)
          postPluginMessage({
            type: 'run-linter',
            nodeIds: selections.map(s => s.id),
            source: 'component-validation',
          })
        }
      }
      if (message.type === 'apply-color-tokens-result') {
        setApplyingTokenNodeIds(prev => {
          const next = new Set(prev)
          next.delete(message.rootNodeId)
          return next
        })
        setImageRefreshKey(k => k + 1)
        const appliedResultMap = new Map(
          message.results
            .filter(r => r.status === 'success')
            .map(r => [r.nodeId, r])
        )

        setResults(prev =>
          prev.map(result => {
            if (result.id !== message.rootNodeId) return result

            const componentIssues = result.issues.filter(
              i => i.source === 'component'
            )

            // finalIssuesに残っているdesign-token issue
            const newTokenIssues = message.finalIssues.filter(
              i => i.source === 'design-token'
            )

            // 修正済みだがfinalIssuesに残っていないノード → resolved
            const finalNodeIds = new Set(newTokenIssues.map(i => i.nodeId))
            const resolvedIssues = result.issues
              .filter(
                i =>
                  i.source === 'design-token' &&
                  appliedResultMap.has(i.nodeId) &&
                  !finalNodeIds.has(i.nodeId)
              )
              .map(issue => {
                const applied = appliedResultMap.get(issue.nodeId)!
                return {
                  ...issue,
                  severity: 'resolved' as const,
                  message:
                    applied.isFallback && applied.appliedRole
                      ? `近似色の「${applied.appliedRole}」を適用`
                      : applied.appliedRole
                        ? `${applied.appliedRole}を適用しました`
                        : '修正しました',
                  messageDetails:
                    applied.isFallback && applied.originalColorHex
                      ? `元の色: ${applied.originalColorHex}`
                      : null,
                }
              })

            return {
              ...result,
              issues: [
                ...componentIssues,
                ...resolvedIssues,
                ...newTokenIssues,
              ],
            }
          })
        )
      }
      if (message.type === 'apply-border-tokens-result') {
        setApplyingTokenNodeIds(prev => {
          const next = new Set(prev)
          next.delete(message.rootNodeId)
          return next
        })
        setImageRefreshKey(k => k + 1)
        const appliedResultMap = new Map<string, ApplyTokenResult[]>()
        for (const r of message.results) {
          if (r.status !== 'success') continue
          const list = appliedResultMap.get(r.nodeId) ?? []
          list.push(r)
          appliedResultMap.set(r.nodeId, list)
        }

        setResults(prev =>
          prev.map(result => {
            if (result.id !== message.rootNodeId) return result

            const componentIssues = result.issues.filter(
              i => i.source === 'component'
            )

            const newTokenIssues = message.finalIssues.filter(
              i => i.source === 'design-token'
            )

            const finalNodeIds = new Set(newTokenIssues.map(i => i.nodeId))
            const resolvedIssues = result.issues
              .filter(
                i =>
                  i.source === 'design-token' &&
                  appliedResultMap.has(i.nodeId) &&
                  !finalNodeIds.has(i.nodeId)
              )
              .map(issue => {
                const results = appliedResultMap.get(issue.nodeId) ?? []
                return {
                  ...issue,
                  severity: 'resolved' as const,
                  message: formatBorderResolvedMessage(issue.message, results),
                  messageDetails: null,
                }
              })

            return {
              ...result,
              issues: [
                ...componentIssues,
                ...resolvedIssues,
                ...newTokenIssues,
              ],
            }
          })
        )
      }
      if (
        message.type === 'lint-result' &&
        message.source === 'component-validation'
      ) {
        // コンポーネント適用後の再検証: デザイントークンissueのみ置換
        setIsRelinting(false)
        setResults(prev =>
          prev.map(result => {
            const newResult = message.results.find(r => r.id === result.id)
            if (!newResult) return result
            const componentIssues = result.issues.filter(
              i => i.source === 'component'
            )
            return {
              ...result,
              issues: [...componentIssues, ...newResult.issues],
              totalNodes: newResult.totalNodes,
            }
          })
        )
      }
      if (message.type === 'lint-result' && message.source === 'lint-view') {
        // デザイントークン検証完了、まず結果を表示
        setIsLoading(false)
        setResults(message.results)
        onPhaseChange('results')

        // APIキーがあればコンポーネント検証を裏で実行
        if (apiKey) {
          const runComponentValidation = async () => {
            const componentResultMap = new Map<
              string,
              { issues: Issue[]; totalComponents: number }
            >()
            for (const result of message.results) {
              if (!result.structure) continue
              const image = selectionImages[result.id]
              const componentResult = await validateComponents(
                result.structure,
                image
              )
              // キャンセルされた場合はループを中断
              if (componentResult === null) {
                return
              }
              componentResultMap.set(result.id, {
                issues: componentResult?.issues || [],
                totalComponents:
                  componentResult?.candidates.filter(
                    c => c.suggestedComponent !== null
                  ).length ?? 0,
              })
            }
            // prevベースでマージ（apply-tokens等の更新を保持）
            setResults(prev =>
              prev.map(result => {
                const comp = componentResultMap.get(result.id)
                if (!comp) return result
                return {
                  ...result,
                  issues: [...result.issues, ...comp.issues],
                  totalComponents: comp.totalComponents,
                }
              })
            )
          }
          runComponentValidation()
        }
      }
    },
    [apiKey, selections, selectionImages, validateComponents, onPhaseChange]
  )

  const handleRunLinter = useCallback(() => {
    setIsLoading(true)
    postPluginMessage({
      type: 'run-linter',
      nodeIds: selections.map(s => s.id),
      source: 'lint-view',
    })
  }, [selections])

  // コンポーネントの適用ハンドラ
  const handleApplyComponents = useCallback(
    (rootNodeId: string) => {
      const result = results.find(r => r.id === rootNodeId)
      if (!result) return

      const items: ComponentToFix[] = []
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
        setApplyingComponentNodeIds(prev => new Set(prev).add(rootNodeId))
        postPluginMessage({ type: 'apply-components', rootNodeId, items })
      }
    },
    [results]
  )

  // デザイントークンの修正ハンドラ
  const handleApplyTokens = useCallback(
    (rootNodeId: string) => {
      const result = results.find(r => r.id === rootNodeId)
      if (!result) return

      const tokenIssues = result.issues.filter(
        (issue): issue is DesignTokenIssue =>
          issue.source === 'design-token' && issue.severity !== 'resolved'
      )

      // カラー系issueとボーダー系issueを分離
      const colorIssues = tokenIssues.filter(issue => !isBorderIssue(issue))
      const borderIssues = tokenIssues.filter(issue => isBorderIssue(issue))

      let hasSentAny = false

      // カラー系issue → apply-tokens
      if (colorIssues.length > 0) {
        const seen = new Set<string>()
        const items: ColorTokenToFix[] = []
        for (const issue of colorIssues) {
          if (seen.has(issue.nodeId)) continue
          seen.add(issue.nodeId)
          const targetProperty =
            issue.nodeType === 'TEXT' ? 'textColor' : 'backgroundColor'
          const suggestion =
            issue.suggestion &&
            issue.suggestion.targetProperty === targetProperty
              ? issue.suggestion
              : undefined
          items.push({
            nodeId: issue.nodeId,
            ...(suggestion && { suggestion }),
            targetProperty,
          })
        }
        if (items.length > 0) {
          postPluginMessage({ type: 'apply-tokens', rootNodeId, items })
          hasSentAny = true
        }
      }

      // ボーダー系issue → apply-border-tokens
      if (borderIssues.length > 0) {
        const borderItems: BorderTokenToFix[] = borderIssues.map(issue => {
          let targetProperty: BorderTokenToFix['targetProperty']
          if (issue.message.includes('線色')) {
            targetProperty = 'strokeColor'
          } else if (issue.message.includes('線幅')) {
            targetProperty = 'strokeWeight'
          } else {
            targetProperty = 'cornerRadius'
          }
          return { nodeId: issue.nodeId, targetProperty }
        })
        postPluginMessage({
          type: 'apply-border-tokens',
          rootNodeId,
          items: borderItems,
        })
        hasSentAny = true
      }

      if (hasSentAny) {
        setApplyingTokenNodeIds(prev => new Set(prev).add(rootNodeId))
      }
    },
    [results]
  )

  const resetResults = useCallback(() => {
    setResults([])
  }, [])

  return {
    results,
    isLoading,
    apiKey,
    applyingTokenNodeIds,
    applyingComponentNodeIds,
    isRelinting,
    imageRefreshKey,
    componentValidationState,
    cancelComponentValidation,
    handleRunLinter,
    handleApplyComponents,
    handleApplyTokens,
    handleLintMessage,
    resetResults,
  }
}
