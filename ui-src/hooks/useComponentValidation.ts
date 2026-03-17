import { createOpenAI } from '@ai-sdk/openai'
import { generateObject, NoObjectGeneratedError } from 'ai'
import { useCallback, useRef, useState } from 'react'
import { NodeStructure } from '../../shared-src/models/PluginMessage'
import { Issue } from '../../shared-src/models/Rules'
import { serializeNodeStructure } from '../utils/serializeNodeStructure'
import { PROMPT_TO_NEST_PROPERTY } from '../../shared-src/utils/nestProperty'
import {
  componentValidationResponseSchema,
  ComponentCandidate,
  filterValidCandidates,
} from '../models/componentValidationSchema'
import componentKeys from '../../shared-src/assets/component-keys.json'
import componentsManifest from '../../shared-src/assets/components_manifest.json'
import { ComponentKeysMap } from '../../shared-src/models/ComponentKeys'
import { ComponentManifestEntry } from '../../shared-src/models/ComponentManifest'
import ClientStorage from '../../shared-src/models/ClientStorage'
import { getBasePropName } from '../../shared-src/utils/getBasePropName'

const componentKeysMap = componentKeys as ComponentKeysMap
const fallbackComponentsManifest = componentsManifest as ComponentManifestEntry[]

type ValidationState = 'idle' | 'analyzing' | 'done' | 'error'

export type ComponentValidationResult = {
  candidates: ComponentCandidate[]
  issues: Issue[]
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string')
}

function isRuntimeComponentKeysMap(value: unknown): value is ComponentKeysMap {
  if (!isRecord(value)) return false

  return Object.values(value).every(entry => {
    if (!isRecord(entry)) return false
    if (
      typeof entry.key !== 'string' ||
      typeof entry.name !== 'string' ||
      typeof entry.description !== 'string' ||
      typeof entry.nodeId !== 'string'
    ) {
      return false
    }
    if (entry.type !== 'COMPONENT' && entry.type !== 'COMPONENT_SET') {
      return false
    }
    if (entry.componentProperties === undefined) {
      return true
    }
    if (!Array.isArray(entry.componentProperties)) {
      return false
    }

    return entry.componentProperties.every(property => {
      if (!isRecord(property)) return false
      if (typeof property.name !== 'string' || typeof property.type !== 'string') {
        return false
      }

      switch (property.type) {
        case 'VARIANT':
          return isStringArray(property.options)
        case 'BOOLEAN':
          return typeof property.defaultValue === 'boolean'
        case 'TEXT':
          return typeof property.defaultValue === 'string'
        case 'INSTANCE_SWAP':
          return isStringArray(property.preferredComponentSets)
        default:
          return false
      }
    })
  })
}

function isRuntimeComponentsManifest(
  value: unknown
): value is ComponentManifestEntry[] {
  return (
    Array.isArray(value) &&
    value.every(entry => {
      if (!isRecord(entry)) return false
      return (
        typeof entry.name === 'string' && typeof entry.description === 'string'
      )
    })
  )
}

function requestStorageValue<T>(key: string): Promise<T | null> {
  return new Promise(resolve => {
    const onMessage = (event: MessageEvent) => {
      const message = event.data.pluginMessage
      if (message?.type === 'storage-value' && message.key === key) {
        window.removeEventListener('message', onMessage)
        resolve((message.value as T | undefined) ?? null)
      }
    }

    window.addEventListener('message', onMessage)
    parent.postMessage(
      {
        pluginMessage: {
          type: 'get-storage',
          key,
        },
      },
      '*'
    )
  })
}

async function loadRuntimeComponentAssets(): Promise<{
  componentKeys: ComponentKeysMap
  componentsManifest: ComponentManifestEntry[]
}> {
  const [storedComponentKeys, storedComponentsManifest] = await Promise.all([
    requestStorageValue<unknown>(ClientStorage.RUNTIME_COMPONENT_KEYS),
    requestStorageValue<unknown>(ClientStorage.RUNTIME_COMPONENTS_MANIFEST),
  ])

  return {
    componentKeys: isRuntimeComponentKeysMap(storedComponentKeys)
      ? storedComponentKeys
      : componentKeysMap,
    componentsManifest: isRuntimeComponentsManifest(storedComponentsManifest)
      ? storedComponentsManifest
      : fallbackComponentsManifest,
  }
}

function generateComponentListFromAssets(
  componentKeysMap: ComponentKeysMap,
  componentsManifest: ComponentManifestEntry[]
): string {
  const validComponentNames = new Set(Object.keys(componentKeysMap))
  return componentsManifest
    .filter(c => validComponentNames.has(c.name))
    .map(c => (c.description ? `- ${c.name}: ${c.description}` : `- ${c.name}`))
    .join('\n')
}

function generateComponentPropertiesInfoFromAssets(
  componentKeysMap: ComponentKeysMap
): string {
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
        const runtimeAssets = await loadRuntimeComponentAssets()

        const componentPropertiesInfo = generateComponentPropertiesInfoFromAssets(
          runtimeAssets.componentKeys
        )
        const componentList = generateComponentListFromAssets(
          runtimeAssets.componentKeys,
          runtimeAssets.componentsManifest
        )
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
- isSDSComponent: trueのノードは既にSerendie UIを使用しているため、候補に含めないでください
- isSDSComponent: falseまたは未設定のINSTANCEノードで、対応するSDSコンポーネントがあれば候補として返してください
- 最上位のノードだけでなく、子ノードも含めて全て分析してください
- コンポーネントを提案する際、プロパティがあるコンポーネントの場合はpropertiesも指定してください
- instance swapプロパティは「ComponentSetName/VariantValue」形式で指定してください（例: "OutlinedSerendieSymbols/arrow_back"）
- TEXTプロパティにはノード構造に含まれるテキスト内容（text: "..."）をそのまま使用してください。絶対に変更しないでください
- プロパティは省略せず、必要なVARIANT・BOOLEAN・TEXTプロパティを全て明示的に指定してください
- INSTANCE_SWAPプロパティ（leftContent、rightContent、IconInstanceなど）は、元のデザインに該当するアイコンや要素が実際に表示されている場合のみ指定してください。placeholderや空のアイコンは指定しないでください
- あるノードをコンポーネントとして提案する場合、その子ノードは別途提案しないでください（例：TextFieldを提案する場合、その中のBadgeやアイコンは提案不要）
${PROMPT_TO_NEST_PROPERTY}

# confidenceの基準
要素・プロパティが完全に特定できない場合でも、網羅性を重視して、confidenceを調整しながら提案してください
- high: 一般的なUIパターン（ボタン、入力フィールド、リストアイテム等）として明確に認識でき、対応するSDSコンポーネントがある
- medium: 子要素の構成からUIパターンと推測できるが、構造が典型的でない（例：入力フィールド+追加要素の組み合わせ）
- low: 推測に基づく提案、または複数のコンポーネント候補が考えられる

# Labelプロパティを持つコンポーネントについて
- SDSコンポーネントがLabelプロパティを持つ場合、ラベルテキストと入力要素を包む親Frameを対象ノードとして選定してください

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

        const maxTryCount = 2

        const callGenerateObject = () =>
          generateObject({
            model: openai('gpt-5.2-codex'),
            schema: componentValidationResponseSchema,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userContent },
            ],
            temperature: 0,
            abortSignal: abortController.signal,
          })

        let candidates: ComponentCandidate[] | null = null
        let lastError: unknown = null
        let tryCount = 0

        while (tryCount < maxTryCount && candidates === null) {
          tryCount++
          try {
            const response = await callGenerateObject()
            candidates = response.object.candidates
          } catch (err) {
            lastError = err
            if (!NoObjectGeneratedError.isInstance(err)) throw err
            console.warn(
              `Attempt ${tryCount}/${maxTryCount} failed:`,
              err
            )
          }
        }

        // 全リトライ失敗 → エラーテキストから部分的な結果を抽出
        if (candidates === null) {
          const errorText = NoObjectGeneratedError.isInstance(lastError)
            ? lastError.text
            : undefined
          try {
            const parsed = JSON.parse(errorText ?? '')
            if (Array.isArray(parsed?.candidates)) {
              candidates = filterValidCandidates(parsed.candidates)
            }
          } catch {
            // パース失敗は無視
          }
          if (!candidates || candidates.length === 0) throw lastError
          console.warn(
            'Using partially extracted candidates:',
            candidates.length
          )
        }
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
