import { Issue } from '../../../shared-src/models/Rules'
import { ColorInfo } from '../extractors/extractColorInfo'
import validate from '../rules/assignTextVariable'

export default function validateAssignTextVariable(
  colorInfoList: ColorInfo[]
): { issues: Issue[] } {
  const issues: Issue[] = []

  for (const colorInfo of colorInfoList) {
    if (colorInfo.nodeType !== 'TEXT') continue

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
