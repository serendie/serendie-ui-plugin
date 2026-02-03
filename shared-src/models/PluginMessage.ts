import {
  Issue,
  ComponentSuggestion,
  DesignTokenSuggestion,
  DesignTokenTargetProperty,
} from './Rules'

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

// 修正・適用対象データ型
export type ComponentApplyTarget = {
  nodeId: string
} & ComponentSuggestion

export type ColorTokenFixTarget = {
  nodeId: string
  suggestion?: DesignTokenSuggestion // あれば使う（確実な候補）
  targetProperty: 'textColor' | 'backgroundColor' // フォールバック判定に使用
}

export type BorderTokenFixTarget = {
  nodeId: string
  targetProperty: 'strokeColor' | 'strokeWeight' | 'cornerRadius'
}

export type ApplyComponentResult = {
  oldNodeId: string
  newNodeId: string
  status: 'success' | 'failed' | 'skipped'
}

export type TokenFixResult = {
  nodeId: string
  status: 'success' | 'failed'
  appliedRole?: string | string[]
  targetProperty?: DesignTokenTargetProperty // 修正対象プロパティ
  isFallback?: boolean // フォールバック候補からの適用かどうか
  originalColorHex?: string // 適用前の元の色（hex）
}

// 修正進捗
export type FixTokensProgress = {
  phase: 'color' | 'border' | 'relint'
  current: number
  total: number
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
      type: 'fix-color-tokens-result'
      rootNodeId: string
      results: TokenFixResult[]
      postFixIssues: Issue[] // 修正後の再リント結果
    }
  | {
      type: 'fix-border-tokens-result'
      rootNodeId: string
      results: TokenFixResult[]
      postFixIssues: Issue[]
    }
  | {
      type: 'fix-tokens-progress'
      rootNodeId: string
      progress: FixTokensProgress
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
      targets: ComponentApplyTarget[]
    }
  | { type: 'select-node'; nodeId: string }
  | {
      type: 'fix-color-tokens'
      rootNodeId: string
      targets: ColorTokenFixTarget[]
    }
  | {
      type: 'fix-border-tokens'
      rootNodeId: string
      targets: BorderTokenFixTarget[]
    }

// 全メッセージ型
export type PluginMessage = PluginToUIMessage | UIToPluginMessage
