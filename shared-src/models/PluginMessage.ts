import { Issue, ComponentSuggestion, DesignTokenSuggestion } from './Rules'

// インスタンスのコンポーネントプロパティ
export type ComponentProperty = {
  name: string
  type: string
  value: string | boolean
}

// ノード構造情報（階層構造）
export type NodeStructure = {
  nodeId: string
  nodeName: string
  nodeType: string
  fills: string[]
  strokes: string[]
  textStyle?: string
  textContent?: string
  width: number
  height: number
  children: NodeStructure[]
  // インスタンス固有の情報
  componentName?: string
  componentProperties?: ComponentProperty[]
  isSDSComponent?: boolean
}

// Lint結果の型（ui-src/models/Result.tsと同じ構造）
export type LintResult = {
  name: string
  id: string
  issues: Issue[]
  totalNodes: number
  structure: NodeStructure
}

// 選択要素の情報
export type SelectionInfo = {
  id: string
  name: string
}

type Source = 'chat-view' | 'lint-view' | 'component-validation'

// Lint関連メッセージ
export type LintMessage =
  | { type: 'lint-result'; results: LintResult[]; source?: Source }
  | { type: 'run-linter' }

// 選択関連メッセージ
export type SelectionMessage =
  | { type: 'selection-changed'; selections: SelectionInfo[] }
  | { type: 'request-selection' }

// 画像関連メッセージ
export type SelectionImage = { nodeId: string; image: string | null }
export type ImageMessage =
  | { type: 'selection-images'; images: SelectionImage[] }
  | { type: 'get-selection-images'; nodeIds: string[] }

// エラーメッセージ
export type ErrorMessage = { type: 'error'; message: string }

// コンポーネント適用結果メッセージ
export type ApplyComponentsResultMessage = {
  type: 'apply-components-result'
  rootNodeId: string
  results: ApplyComponentResult[]
}

// トークン修正アイテム
export type ApplyTokenItem = {
  nodeId: string
  suggestion?: DesignTokenSuggestion // あれば使う（確実な候補）
  targetProperty: 'textColor' | 'backgroundColor' // フォールバック判定に使用
}

// トークン修正結果（個別ノード）
export type ApplyTokenResult = {
  nodeId: string
  status: 'success' | 'failed'
  appliedRole?: string
  isFallback?: boolean // フォールバック候補からの適用かどうか
  originalColorHex?: string // 適用前の元の色（hex）
}

// トークン修正結果メッセージ
export type ApplyTokensResultMessage = {
  type: 'apply-tokens-result'
  rootNodeId: string
  results: ApplyTokenResult[]
}

// Plugin → UI
export type PluginToUIMessage =
  | LintMessage
  | SelectionMessage
  | ImageMessage
  | ErrorMessage
  | ApplyComponentsResultMessage
  | ApplyTokensResultMessage

// コンポーネント適用アイテム
export type ApplyComponentItem = {
  nodeId: string
} & ComponentSuggestion

// コンポーネント適用結果（個別ノード）
export type ApplyComponentResult = {
  oldNodeId: string
  newNodeId: string
  status: 'success' | 'failed' | 'skipped'
}

// UI → Plugin
export type UIToPluginMessage =
  | { type: 'run-linter'; nodeIds: string[]; source: Source }
  | { type: 'request-selection' }
  | { type: 'get-selection-images'; nodeIds: string[] }
  | { type: 'clear-selection' }
  | { type: 'notify'; message: string }
  | {
      type: 'apply-components'
      rootNodeId: string // コピー元のルートノードID
      items: ApplyComponentItem[]
    }
  | { type: 'select-node'; nodeId: string }
  | {
      type: 'apply-tokens'
      rootNodeId: string
      items: ApplyTokenItem[]
    }

// 全メッセージ型
export type PluginMessage = PluginToUIMessage | UIToPluginMessage
