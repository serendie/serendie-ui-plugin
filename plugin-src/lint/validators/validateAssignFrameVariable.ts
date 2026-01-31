import {
  Issue,
  FRAME_TYPES,
  DesignTokenSuggestion,
  TEXT_COLOR_PAIRS,
} from '../../../shared-src/models/Rules'
import { ColorInfo } from '../extractors/extractColorInfo'
import validate from '../rules/assignFrameVariable'
import extractColorRole from '../core/extractColorRole'

function computeSuggestion(
  node: ColorInfo
): DesignTokenSuggestion | undefined {
  if (!node.textColor) return undefined
  const textRole = extractColorRole(node.textColor)
  if (!textRole || !(textRole in TEXT_COLOR_PAIRS)) return undefined
  const candidates = TEXT_COLOR_PAIRS[textRole]
  const targetRole = typeof candidates === 'string' ? candidates : candidates[0]
  if (!targetRole) return undefined
  return { targetRole, targetProperty: 'backgroundColor' }
}

export default function validateAssignFrameVariable(nodes: ColorInfo[]): {
  issues: Issue[]
} {
  const issues: Issue[] = []

  for (const node of nodes) {
    // フレーム系ノードのみチェック
    if (!FRAME_TYPES.includes(node.nodeType as (typeof FRAME_TYPES)[number]))
      continue

    // 背景色がNone（色なし）の場合はスキップ
    if (node.backgroundColor === 'None') continue

    const issueDetail = validate(node.backgroundColor)
    if (issueDetail) {
      issues.push({
        nodeId: node.nodeId,
        nodeName: node.nodeName,
        nodeType: node.nodeType,
        source: 'design-token',
        ...issueDetail,
        ...(issueDetail.severity === 'error' && {
          suggestion: computeSuggestion(node),
        }),
      })
    }
  }

  return {
    issues,
  }
}
