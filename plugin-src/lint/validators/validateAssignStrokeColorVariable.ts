import { Issue } from '../../../shared-src/models/Rules'
import { BorderInfo } from '../extractors/extractBorderInfo'
import validate from '../rules/assignStrokeColorVariable'

export default function validateAssignStrokeColorVariable(
  nodes: BorderInfo[]
): {
  issues: Issue[]
} {
  const issues: Issue[] = []

  for (const node of nodes) {
    const ruleResult = validate(node.strokeColor)
    if (ruleResult) {
      issues.push({
        nodeId: node.nodeId,
        nodeName: node.nodeName,
        nodeType: node.nodeType,
        source: 'design-token',
        targetProperty: 'strokeColor',
        ...ruleResult,
      })
    }
  }

  return {
    issues,
  }
}
