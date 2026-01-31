import { Issue } from '../../../shared-src/models/Rules'
import { ColorInfo } from '../extractors/extractColorInfo'
import validate from '../rules/colorPairing'

export default function validateColorPairing(colorInfoList: ColorInfo[]): {
  issues: Issue[]
} {
  const issues: Issue[] = []
  for (const colorInfo of colorInfoList) {
    const ruleResult = validate(colorInfo.textColor, colorInfo.backgroundColor)
    if (ruleResult) {
      issues.push({
        nodeId: colorInfo.nodeId,
        nodeName: colorInfo.nodeName,
        nodeType: colorInfo.nodeType,
        source: 'design-token',
        ...ruleResult,
      })
    }
  }

  return {
    issues,
  }
}
