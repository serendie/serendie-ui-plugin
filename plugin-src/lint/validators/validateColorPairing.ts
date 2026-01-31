import {
  Issue,
  DesignTokenSuggestion,
  BACKGROUND_COLOR_PAIRS,
} from '../../../shared-src/models/Rules'
import { ColorInfo } from '../extractors/extractColorInfo'
import validate from '../rules/colorPairing'
import extractColorRole from '../core/extractColorRole'

function computeSuggestion(
  colorInfo: ColorInfo
): DesignTokenSuggestion | undefined {
  if (!colorInfo.backgroundColor) return undefined
  const bgRole = extractColorRole(colorInfo.backgroundColor)
  if (!bgRole || !(bgRole in BACKGROUND_COLOR_PAIRS)) return undefined
  const candidates = BACKGROUND_COLOR_PAIRS[bgRole]
  const targetRole = typeof candidates === 'string' ? candidates : candidates[0]
  if (!targetRole) return undefined
  return { targetRole, targetProperty: 'textColor' }
}

export default function validateColorPairing(colorInfoList: ColorInfo[]): {
  issues: Issue[]
} {
  const issues: Issue[] = []
  for (const colorInfo of colorInfoList) {
    const issueDetail = validate(colorInfo.textColor, colorInfo.backgroundColor)
    if (issueDetail) {
      issues.push({
        nodeId: colorInfo.nodeId,
        nodeName: colorInfo.nodeName,
        nodeType: colorInfo.nodeType,
        source: 'design-token',
        ...issueDetail,
        suggestion: computeSuggestion(colorInfo),
      })
    }
  }

  return {
    issues,
  }
}
