import { createOpenAI } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { useCallback, useRef, useState } from 'react'
import { NodeStructure } from '../../shared-src/models/PluginMessage'
import { Issue } from '../../shared-src/models/Rules'
import { serializeNodeStructure } from '../../shared-src/utils/serializeNodeStructure'
import {
  componentValidationResponseSchema,
  ComponentCandidate,
} from './componentValidationSchema'
import componentsManifest from '../../shared-src/assets/components_manifest.json'

// SDSコンポーネント名のリスト
const SDS_COMPONENT_NAMES = componentsManifest.map(c => c.name)

type ValidationState = 'idle' | 'analyzing' | 'done' | 'error'

export type ComponentValidationResult = {
  candidates: ComponentCandidate[]
  issues: Issue[]
}

// ノード構造をフラット化してnodeIdでアクセスできるようにする
function flattenNodes(node: NodeStructure): Map<string, NodeStructure> {
  const map = new Map<string, NodeStructure>()
  const traverse = (n: NodeStructure) => {
    map.set(n.nodeId, n)
    n.children.forEach(traverse)
  }
  traverse(node)
  return map
}

// SDSコンポーネントかどうかを判定
function isSDSComponent(componentName: string | undefined): boolean {
  if (!componentName) return false
  // コンポーネント名がSDSリストに含まれているか確認
  return SDS_COMPONENT_NAMES.some(
    sdsName =>
      componentName === sdsName || componentName.startsWith(`${sdsName}/`)
  )
}

export function useComponentValidation({ apiKey }: { apiKey: string }) {
  const [state, setState] = useState<ValidationState>('idle')
  const [result, setResult] = useState<ComponentValidationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const validate = useCallback(
    async (
      structure: NodeStructure,
      image?: string
    ): Promise<ComponentValidationResult | null> => {
      // 既存のリクエストをキャンセル
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      const abortController = new AbortController()
      abortControllerRef.current = abortController

      setState('analyzing')
      setError(null)

      try {
        const openai = createOpenAI({ apiKey })
        const serializedStructure = serializeNodeStructure(structure)

        const systemPrompt = `あなたはSerendie Design System（SDS）の専門家です。
与えられたFigmaノード構造と画像を分析し、各ノードがSDSのどのコンポーネントとして実装されるべきかを判断してください。

# SDSで利用可能なコンポーネント
${SDS_COMPONENT_NAMES.join(', ')}

# 判断基準
- ノードの視覚的な特徴（サイズ、形状、色）
- ノード名やタイプ
- 子要素の構成
- SDSコンポーネントの典型的な使用パターン

# 注意事項
- SDSコンポーネントに該当しないノード（単純なFrame、装飾的な要素など）はsuggestedComponentをnullにしてください
- INSTANCEノードで既にcomponentNameがある場合、それがSDSコンポーネントかどうかも考慮してください
- 最上位のノードだけでなく、子ノードも含めて全て分析してください

# 重要: nodeIdについて
- nodeIdは必ずノード構造に記載されている正確なID（例: "1234:5678"）を使用してください
- ノード名ではなく、実際のnodeIdを返してください`

        const userContent = image
          ? [
              { type: 'image' as const, image },
              {
                type: 'text' as const,
                text: `以下のノード構造を分析してください:\n\n${serializedStructure}`,
              },
            ]
          : `以下のノード構造を分析してください:\n\n${serializedStructure}`

        const response = await generateObject({
          model: openai('gpt-4.1'),
          schema: componentValidationResponseSchema,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent },
          ],
          abortSignal: abortController.signal,
        })

        const candidates = response.object.candidates
        const nodeMap = flattenNodes(structure)

        console.log('=== Component Validation Results ===')
        console.log('Candidates:', candidates)

        // 検証：候補と実際のコンポーネントを比較してIssueを生成
        const issues: Issue[] = []
        for (const candidate of candidates) {
          if (!candidate.suggestedComponent) continue

          const node = nodeMap.get(candidate.nodeId)
          if (!node) continue

          const actualIsSDSComponent = isSDSComponent(node.componentName)

          if (!actualIsSDSComponent) {
            issues.push({
              nodeId: candidate.nodeId,
              nodeName: node.nodeName,
              nodeType: node.nodeType,
              severity: 'warning',
              message: `「${candidate.suggestedComponent}」を未使用`,
              suggestion: `「${candidate.suggestedComponent}」コンポーネントを使用できる可能性があります。`,
              source: 'component',
            })
          }
        }

        const validationResult = { candidates, issues }
        console.log('Issues:', issues)
        console.log('=== End Component Validation ===')
        setResult(validationResult)
        setState('done')
        return validationResult
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          console.log('Component validation aborted')
          return null
        }
        console.error('Component validation error:', err)
        setError(
          err instanceof Error ? err.message : '検証中にエラーが発生しました'
        )
        setState('error')
        return null
      } finally {
        abortControllerRef.current = null
      }
    },
    [apiKey]
  )

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setState('idle')
  }, [])

  const reset = useCallback(() => {
    cancel()
    setResult(null)
    setError(null)
  }, [cancel])

  return {
    state,
    result,
    error,
    validate,
    cancel,
    reset,
  }
}
