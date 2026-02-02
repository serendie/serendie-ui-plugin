import { Issue } from '../../../shared-src/models/Rules'
import { BorderInfo } from '../extractors/extractBorderInfo'
import validate from '../rules/assignCornerRadiusVariable'

export default function validateAssignCornerRadiusVariable(
  nodes: BorderInfo[]
): {
  issues: Issue[]
} {
  const issues: Issue[] = []

  for (const node of nodes) {
    const ruleResult = validate(node.cornerRadius)
    if (ruleResult) {
      issues.push({
        nodeId: node.nodeId,
        nodeName: node.nodeName,
        nodeType: node.nodeType,
        source: 'design-token',
        targetProperty: 'cornerRadius',
        ...ruleResult,
      })
    }
  }

  return {
    issues,
  }
}
