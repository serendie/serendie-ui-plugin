import { Issue } from './Rules'

// ノード分析結果（階層構造）
export type NodeAnalysis = {
  nodeId: string
  nodeName: string
  nodeType: string
  fills: string[]
  strokes: string[]
  width: number
  height: number
  children: NodeAnalysis[]
}

// Lint結果の型（ui-src/models/Result.tsと同じ構造）
export type LintResult = {
  name: string
  id: string
  issues: Issue[]
  totalNodes: number
  analysis: NodeAnalysis
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

// UI → Plugin
export type UIToPluginMessage =
  | { type: 'run-linter'; nodeIds: string[]; source: Source }
  | { type: 'request-selection' }
  | { type: 'get-selection-images'; nodeIds: string[] }
  | { type: 'clear-selection' }

// 全メッセージ型
export type PluginMessage = PluginToUIMessage | UIToPluginMessage
