import { Issue, serializeIssues } from '../../shared-src/models/Rules'
import { NodeStructure } from '../../shared-src/models/PluginMessage'

export type Result = {
  name: string
  id: string
  issues: Issue[]
  totalNodes: number
  structure: NodeStructure
  totalComponents?: number
}

export function serializeResult(result: Result): string {
  if (result.issues.length === 0) {
    return `対象の要素 "${result.name}" には問題が見つかりませんでした。`
  }

  return `対象の要素 "${result.name}" には、${result.issues.length}件の問題が見つかりました。

  ${result.issues.map(serializeIssues).join('\n')}`
}
