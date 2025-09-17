import { UNEXPECTED } from '../../shared-src/models/Rules'
import extractVariableKey from './extractVariableKey'
import getVariableMap from './getVariableMap'
import traceBackgroundColor from './traceFillDefinition'

export type ColorInfo = {
  nodeId: string
  nodeName: string
  nodeType: string
  textColor: string | null
  backgroundColor: string | null
}

export default async function extractColorInfo(
  node: SceneNode
): Promise<ColorInfo[]> {
  const variableMap = await getVariableMap()
  if (variableMap.size === 0) {
    return []
  }

  const results: ColorInfo[] = []
  if (node.type === 'TEXT') {
    const textNode = node as TextNode
    let textColor: string | null = null
    if (
      'fills' in textNode &&
      Array.isArray(textNode.fills) &&
      textNode.fills.length > 0
    ) {
      const fill = textNode.fills[0]
      if (
        fill.type === 'SOLID' &&
        'boundVariables' in fill &&
        fill.boundVariables?.color
      ) {
        const variableId = extractVariableKey(fill.boundVariables.color.id)
        if (variableId) {
          textColor = variableMap?.get(variableId) || null
        }
      }
    }
    const backgroundColor = traceBackgroundColor(
      node.parent as SceneNode,
      variableMap
    )
    results.push({
      nodeId: node.id,
      nodeName: node.name,
      nodeType: node.type,
      textColor: textColor || UNEXPECTED,
      backgroundColor: backgroundColor || UNEXPECTED,
    })
  } else if (
    ['FRAME', 'RECTANGLE', 'COMPONENT', 'INSTANCE'].includes(node.type)
  ) {
    let backgroundColor: string | null = null
    let hasColor = false
    if ('fills' in node && Array.isArray(node.fills) && node.fills.length > 0) {
      const fill = node.fills[0]
      if (fill.type === 'SOLID' && fill.visible !== false) {
        hasColor = true
        if ('boundVariables' in fill && fill.boundVariables?.color) {
          const variableId = extractVariableKey(fill.boundVariables.color.id)
          if (variableId) {
            backgroundColor = variableMap?.get(variableId) || null
          }
        }
      }
    }
    if (hasColor) {
      results.push({
        nodeId: node.id,
        nodeName: node.name,
        nodeType: node.type,
        textColor: null,
        backgroundColor: backgroundColor || UNEXPECTED,
      })
    } else {
      results.push({
        nodeId: node.id,
        nodeName: node.name,
        nodeType: node.type,
        textColor: null,
        backgroundColor: null,
      })
    }
  }
  if ('children' in node) {
    for (const child of node.children) {
      const childResults = await extractColorInfo(child)
      results.push(...childResults)
    }
  }
  return results
}
