import { Issue, ComponentSuggestion } from './Rules'

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
  width: number
  height: number
  children: NodeStructure[]
  // インスタンス固有の情報
  componentName?: string
  componentProperties?: ComponentProperty[]
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

type Source = 'chat-view' | 'lint-view'

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

// Plugin → UI
export type PluginToUIMessage =
  | LintMessage
  | SelectionMessage
  | ImageMessage
  | ErrorMessage

// コンポーネント適用アイテム
export type ApplyComponentItem = {
  nodeId: string
} & ComponentSuggestion

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

// 全メッセージ型
export type PluginMessage = PluginToUIMessage | UIToPluginMessage
