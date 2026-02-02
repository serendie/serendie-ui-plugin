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
  structure?: NodeStructure
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

// 検証メッセージ
export type ComponentToFix = {
  nodeId: string
} & ComponentSuggestion

export type ColorTokenToFix = {
  nodeId: string
  suggestion?: DesignTokenSuggestion // あれば使う（確実な候補）
  targetProperty: 'textColor' | 'backgroundColor' // フォールバック判定に使用
}

export type BorderTokenToFix = {
  nodeId: string
  targetProperty: 'strokeColor' | 'strokeWeight' | 'cornerRadius'
}

export type ApplyComponentResult = {
  oldNodeId: string
  newNodeId: string
  status: 'success' | 'failed' | 'skipped'
}

export type ApplyTokenResult = {
  nodeId: string
  status: 'success' | 'failed'
  appliedRole?: string | string[]
  isFallback?: boolean // フォールバック候補からの適用かどうか
  originalColorHex?: string // 適用前の元の色（hex）
}

// Plugin → UI
export type PluginToUIMessage =
  | LintMessage
  | SelectionMessage
  | ImageMessage
  | ErrorMessage
  | {
      type: 'apply-components-result'
      rootNodeId: string
      results: ApplyComponentResult[]
    }
  | {
      type: 'apply-color-tokens-result'
      rootNodeId: string
      results: ApplyTokenResult[]
      finalIssues: Issue[] // 再帰修正後の最終リント結果
    }
  | {
      type: 'apply-border-tokens-result'
      rootNodeId: string
      results: ApplyTokenResult[]
      finalIssues: Issue[]
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
      items: ComponentToFix[]
    }
  | { type: 'select-node'; nodeId: string }
  | {
      type: 'apply-tokens'
      rootNodeId: string
      items: ColorTokenToFix[]
    }
  | {
      type: 'apply-border-tokens'
      rootNodeId: string
      items: BorderTokenToFix[]
    }

// 全メッセージ型
export type PluginMessage = PluginToUIMessage | UIToPluginMessage
