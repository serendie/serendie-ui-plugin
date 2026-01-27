import { createOpenAI } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { useCallback, useRef, useState } from 'react'
import { NodeStructure } from '../../shared-src/models/PluginMessage'
import { Issue } from '../../shared-src/models/Rules'
import { serializeNodeStructure } from '../../shared-src/utils/serializeNodeStructure'
import { PROMPT_TO_NEST_PROPERTY } from '../../shared-src/utils/nestProperty'
import {
  componentValidationResponseSchema,
  ComponentCandidate,
} from './componentValidationSchema'
import componentsManifest from '../../shared-src/assets/components_manifest.json'
import componentKeys from '../../assets/component-keys.json'
import { ComponentKeysMap } from '../../shared-src/models/ComponentKeys'
import { getBasePropName } from '../../shared-src/utils/getBasePropName'

const componentKeysMap = componentKeys as ComponentKeysMap

function generateComponentList(): string {
  return componentsManifest
    .map(c => (c.description ? `- ${c.name}: ${c.description}` : `- ${c.name}`))
    .join('\n')
}

type ValidationState = 'idle' | 'analyzing' | 'done' | 'error'

export type ComponentValidationResult = {
  candidates: ComponentCandidate[]
  issues: Issue[]
}

function generateComponentPropertiesInfo(): string {
  const lines: string[] = []
  for (const [name, info] of Object.entries(componentKeysMap)) {
    if (info.type === 'COMPONENT_SET' && info.componentProperties?.length) {
      const props = info.componentProperties
        .map(p => {
          const propName = getBasePropName(p.name)
          switch (p.type) {
            case 'VARIANT':
              return `${propName}: [${p.options.join(', ')}]`
            case 'BOOLEAN':
              return `${propName}: boolean (default: ${p.defaultValue})`
            case 'TEXT':
              return `${propName}: text`
            case 'INSTANCE_SWAP':
              return `${propName}: instance swap (${p.preferredComponentSets.join(' | ')})`
          }
        })
        .join(', ')
      lines.push(`- ${name}: ${props}`)
    }
  }
  return lines.join('\n')
}

function flattenNodes(node: NodeStructure): Map<string, NodeStructure> {
  const map = new Map<string, NodeStructure>()
  const traverse = (n: NodeStructure) => {
    map.set(n.nodeId, n)
    n.children.forEach(traverse)
  }
  traverse(node)
  return map
}

export function createIssuesFromCandidates(
  candidates: ComponentCandidate[],
  nodeMap: Map<string, NodeStructure>
): Issue[] {
  const issues: Issue[] = []

  for (const candidate of candidates) {
    if (candidate.confidence === 'low') continue

    const node = nodeMap.get(candidate.nodeId)
    if (!node) continue

    // 推奨されたコンポーネントを既に使用しているかチェック
    const isUsingSuggestedComponent =
      node.componentName === candidate.suggestedComponent ||
      node.componentName?.startsWith(`${candidate.suggestedComponent}/`)

    if (!isUsingSuggestedComponent) {
      issues.push({
        nodeId: candidate.nodeId,
        nodeName: node.nodeName,
        nodeType: node.nodeType,
        severity: 'warning',
        message: `「${candidate.suggestedComponent}」を使えます`,
        messageDetails: `${candidate.suggestedComponent}コンポーネントを使うとSerendie UIとして一貫性が出せます。`,
        source: 'component',
        suggestion: {
          componentName: candidate.suggestedComponent,
          properties: candidate.properties,
        },
      })
    }
  }

  return issues
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

      const startTime = performance.now()

      try {
        const openai = createOpenAI({ apiKey })
        const serializedStructure = serializeNodeStructure(structure)

        const componentPropertiesInfo = generateComponentPropertiesInfo()
        const componentList = generateComponentList()
        const systemPrompt = `あなたはSerendie Design System（SDS）の専門家です。
与えられたFigmaノード構造と画像を分析し、各ノードがSDSのどのコンポーネントとして実装されるべきかを判断してください。

# SDSで利用可能なコンポーネント
${componentList}

# コンポーネントのプロパティ
以下のコンポーネントにはプロパティがあります。適切なプロパティを指定してください:
${componentPropertiesInfo}

# 判断基準
- ノードの視覚的な特徴（サイズ、形状、色）
- ノード名やタイプ
- 子要素の構成
- SDSコンポーネントの典型的な使用パターン

# 注意事項
- SDSコンポーネントに該当しないノード（単純なFrame、装飾的な要素など）はcandidatesに含めないでください
- SDSコンポーネントとして置き換え可能なノードのみを返してください
- INSTANCEノードで既にcomponentNameがある場合、それがSDSコンポーネントかどうかも考慮してください
- 最上位のノードだけでなく、子ノードも含めて全て分析してください
- コンポーネントを提案する際、プロパティがあるコンポーネントの場合はpropertiesも指定してください
- instance swapプロパティは「ComponentSetName/VariantValue」形式で指定してください（例: "OutlinedSerendieSymbols/arrow_back"）
- TEXTプロパティにはノード構造に含まれるテキスト内容（text: "..."）をそのまま使用してください。絶対に変更しないでください
- プロパティは省略せず、必要なVARIANT・BOOLEAN・TEXTプロパティを全て明示的に指定してください
- INSTANCE_SWAPプロパティ（leftContent、rightContent、IconInstanceなど）は、元のデザインに該当するアイコンや要素が実際に表示されている場合のみ指定してください。placeholderや空のアイコンは指定しないでください
- あるノードをコンポーネントとして提案する場合、その子ノードは別途提案しないでください（例：TextFieldを提案する場合、その中のBadgeやアイコンは提案不要）
${PROMPT_TO_NEST_PROPERTY}

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
          model: openai('gpt-5.2-codex'),
          schema: componentValidationResponseSchema,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent },
          ],
          abortSignal: abortController.signal,
        })

        const candidates = response.object.candidates
        const nodeMap = flattenNodes(structure)

        const elapsedTime = ((performance.now() - startTime) / 1000).toFixed(2)
        console.log(`=== Component Validation Results (${elapsedTime}s) ===`)
        console.log('Candidates:', candidates)

        const issues = createIssuesFromCandidates(candidates, nodeMap)
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
