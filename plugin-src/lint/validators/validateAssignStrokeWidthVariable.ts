import { Issue } from '../../../shared-src/models/Rules'
import { BorderInfo } from '../extractors/extractBorderInfo'
import validate from '../rules/assignStrokeWidthVariable'

export default function validateAssignStrokeWidthVariable(
  nodes: BorderInfo[]
): {
  issues: Issue[]
} {
  const issues: Issue[] = []

  for (const node of nodes) {
    const ruleResult = validate(node.strokeWeight)
    if (ruleResult) {
      issues.push({
        nodeId: node.nodeId,
        nodeName: node.nodeName,
        nodeType: node.nodeType,
        source: 'design-token',
        targetProperty: 'strokeWeight',
        ...ruleResult,
      })
    }
  }

  return {
    issues,
  }
}
