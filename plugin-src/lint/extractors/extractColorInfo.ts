import { CUSTOM_VALUE, FRAME_TYPES } from '../../../shared-src/models/Rules'
import extractVariableKey from './extractVariableKey'
import getVariableMap, { VariableMap } from './getVariableMap'
import traceBackgroundColor from './traceFillDefinition'
import traceVisibility from './traceVisibility'

export type ColorInfo = {
  nodeId: string
  nodeName: string
  nodeType: string
  textColor: string | null
  backgroundColor: string | null
}

function extractTextColorFromNode(
  node: SceneNode,
  variableMap: VariableMap
): string | null {
  if (
    'fills' in node &&
    Array.isArray(node.fills) &&
    node.fills.length > 0
  ) {
    const fill = node.fills[0]
    if (
      fill.type === 'SOLID' &&
      'boundVariables' in fill &&
      fill.boundVariables?.color
    ) {
      const variableId = extractVariableKey(fill.boundVariables.color.id)
      if (variableId) {
        return variableMap.get(variableId) || null
      }
    }
  }
  return null
}

function hasSolidFill(node: SceneNode): boolean {
  if (!('fills' in node) || !Array.isArray(node.fills)) return false
  const fills = node.fills as Paint[]
  return fills.length > 0 && fills[0].type === 'SOLID' && fills[0].visible !== false
}

function collectChildTextColors(
  node: SceneNode,
  variableMap: VariableMap
): string[] {
  const colors: string[] = []
  if (!('children' in node)) return colors
  for (const child of (node as ChildrenMixin).children) {
    if (child.type === 'TEXT') {
      const color = extractTextColorFromNode(child, variableMap)
      if (color) {
        colors.push(color)
      }
    } else if ('children' in child && !hasSolidFill(child as SceneNode)) {
      // 塗りを持つ子フレームは独自のペアリング対象なので再帰しない
      colors.push(...collectChildTextColors(child as SceneNode, variableMap))
    }
  }
  return colors
}

function resolveChildTextColor(
  node: SceneNode,
  variableMap: VariableMap
): string | null {
  const colors = collectChildTextColors(node, variableMap)
  if (colors.length === 0) return null
  const unique = new Set(colors)
  if (unique.size === 1) return colors[0]
  return null
}

export default async function extractColorInfo(
  node: SceneNode
): Promise<ColorInfo[]> {
  const variableMap = await getVariableMap()
  if (variableMap.size === 0 || !traceVisibility(node)) {
    return []
  }

  const results: ColorInfo[] = []
  if (node.type === 'TEXT') {
    const textColor = extractTextColorFromNode(node, variableMap)
    const backgroundColor = traceBackgroundColor(
      node.parent as SceneNode,
      variableMap
    )
    results.push({
      nodeId: node.id,
      nodeName: node.name,
      nodeType: node.type,
      textColor: textColor || CUSTOM_VALUE,
      backgroundColor: backgroundColor || CUSTOM_VALUE,
    })
  } else if (FRAME_TYPES.includes(node.type as (typeof FRAME_TYPES)[number])) {
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
    const textColor = resolveChildTextColor(node, variableMap)
    if (hasColor) {
      results.push({
        nodeId: node.id,
        nodeName: node.name,
        nodeType: node.type,
        textColor,
        backgroundColor: backgroundColor || CUSTOM_VALUE,
      })
    } else {
      results.push({
        nodeId: node.id,
        nodeName: node.name,
        nodeType: node.type,
        textColor,
        backgroundColor: null,
      })
    }
  }
  if ('children' in node) {
    const childResults = await Promise.all(
      node.children.map(child => extractColorInfo(child))
    )
    for (const r of childResults) {
      results.push(...r)
    }
  }
  return results
}
