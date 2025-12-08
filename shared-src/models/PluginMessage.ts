import { Issue } from './Rules'

// Lint結果の型（ui-src/models/Result.tsと同じ構造）
export type LintResult = {
  name: string
  id: string
  issues: Issue[]
  totalNodes: number
}

// Lint関連メッセージ
export type LintMessage =
  | { type: 'lint-result'; results: LintResult[] }
  | { type: 'run-linter' }

// 選択関連メッセージ
export type SelectionMessage =
  | { type: 'selection-changed'; selectionIds: string[] }
  | { type: 'request-selection' }

// エラーメッセージ
export type ErrorMessage = { type: 'error'; message: string }

// Plugin → UI
export type PluginToUIMessage = LintMessage | SelectionMessage | ErrorMessage

// UI → Plugin
export type UIToPluginMessage =
  | { type: 'run-linter' }
  | { type: 'request-selection' }

// 全メッセージ型
export type PluginMessage = PluginToUIMessage | UIToPluginMessage
