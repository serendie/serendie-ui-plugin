import { Issue } from '../../shared-src/models/Rules'
import { ColorInfo } from '../utils/extractColorInfo'
import validate from '../rules/assignTextVariable'

export default function validateAssignTextVariable(
  colorInfoList: ColorInfo[]
): { issues: Issue[] } {
  const issues: Issue[] = []

  for (const colorInfo of colorInfoList) {
    if (colorInfo.nodeType !== 'TEXT') continue

    const issueDetail = validate(colorInfo.textColor)
    if (issueDetail) {
      issues.push({
        nodeId: colorInfo.nodeId,
        nodeName: colorInfo.nodeName,
        nodeType: colorInfo.nodeType,
        source: 'design-token',
        ...issueDetail,
      })
    }
  }

  return {
    issues,
  }
}
