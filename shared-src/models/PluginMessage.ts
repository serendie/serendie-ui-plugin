import { Issue } from './Rules'

// Lint結果の型（ui-src/models/Result.tsと同じ構造）
export type LintResult = {
  name: string
  id: string
  issues: Issue[]
  totalNodes: number
}

// 選択要素の情報
export type SelectionInfo = {
  id: string
  name: string
}

// Lint関連メッセージ
export type LintMessage =
  | { type: 'lint-result'; results: LintResult[] }
  | { type: 'run-linter' }

// 選択関連メッセージ
export type SelectionMessage =
  | { type: 'selection-changed'; selections: SelectionInfo[] }
  | { type: 'request-selection' }

// 画像関連メッセージ
export type ImageMessage =
  | { type: 'selection-image'; nodeId: string; image: string | null }
  | { type: 'get-selection-image'; nodeId: string }

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
  | { type: 'run-linter' }
  | { type: 'request-selection' }
  | { type: 'get-selection-image'; nodeId: string }

// 全メッセージ型
export type PluginMessage = PluginToUIMessage | UIToPluginMessage
