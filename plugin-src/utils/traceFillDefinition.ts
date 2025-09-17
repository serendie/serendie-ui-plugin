import extractVariableKey from './extractVariableKey'
import { VariableMap } from './getVariableMap'

export default function traceFillDefinition(
  node: SceneNode,
  variableMap: VariableMap
): string | null {
  if ('fills' in node && Array.isArray(node.fills) && node.fills.length > 0) {
    const fill = node.fills[0]
    if (fill.type === 'SOLID' && fill.visible !== false) {
      if ('boundVariables' in fill && fill.boundVariables?.color) {
        const variableId = extractVariableKey(fill.boundVariables.color.id)
        if (variableId) {
          return variableMap.get(variableId) || null
        }
      }
    }
  }
  if (
    node.parent &&
    node.parent.type !== 'PAGE' &&
    node.parent.type !== 'DOCUMENT'
  ) {
    return traceFillDefinition(node.parent as SceneNode, variableMap)
  }

  return null
}
