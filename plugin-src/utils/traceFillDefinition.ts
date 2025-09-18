import extractVariableKey from '../core/extractVariableKey'
import { VariableMap } from './getVariableMap'
import { UNEXPECTED } from '../../shared-src/models/Rules'

export default function traceFillDefinition(
  node: SceneNode,
  variableMap: VariableMap
): string | null {
  if ('fills' in node && Array.isArray(node.fills)) {
    const fills = node.fills.filter(({ visible }) => visible)
    if (fills.length > 0) {
      const fill = fills[0]
      if (fill.type === 'SOLID' && fill.visible !== false) {
        if ('boundVariables' in fill && fill.boundVariables?.color) {
          const variableId = extractVariableKey(fill.boundVariables.color.id)
          if (variableId) {
            return variableMap.get(variableId) || UNEXPECTED
          }
        } else {
          return UNEXPECTED
        }
      } else if (fill.type !== 'SOLID' && fill.visible !== false) {
        return UNEXPECTED
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
