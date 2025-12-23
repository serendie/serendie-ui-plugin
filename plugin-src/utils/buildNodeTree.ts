import { NodeAnalysis } from '../../shared-src/models/PluginMessage'
import extractVariableKey from './extractVariableKey'
import getVariableMap from './getVariableMap'

async function buildNodeTreeRecursive(
  node: SceneNode,
  variableMap: Map<string, string>
): Promise<NodeAnalysis> {
  const extractFills = (node: SceneNode): string[] => {
    const fills: string[] = []
    if ('fills' in node && Array.isArray(node.fills)) {
      for (const fill of node.fills) {
        if (fill.type === 'SOLID' && fill.visible !== false) {
          if ('boundVariables' in fill && fill.boundVariables?.color) {
            const variableId = extractVariableKey(fill.boundVariables.color.id)
            if (variableId) {
              const tokenName = variableMap?.get(variableId)
              if (tokenName) {
                fills.push(tokenName)
              }
            }
          }
        }
      }
    }
    return fills
  }

  const extractStrokes = (node: SceneNode): string[] => {
    const strokes: string[] = []
    if ('strokes' in node && Array.isArray(node.strokes)) {
      for (const stroke of node.strokes) {
        if (stroke.type === 'SOLID' && stroke.visible !== false) {
          if ('boundVariables' in stroke && stroke.boundVariables?.color) {
            const variableId = extractVariableKey(
              stroke.boundVariables.color.id
            )
            if (variableId) {
              const tokenName = variableMap?.get(variableId)
              if (tokenName) {
                strokes.push(tokenName)
              }
            }
          }
        }
      }
    }
    return strokes
  }

  const children: NodeAnalysis[] = []
  if ('children' in node && node.visible) {
    for (const child of node.children) {
      if (!child.visible) {
        continue
      }

      const childAnalysis = await buildNodeTreeRecursive(child, variableMap)
      children.push(childAnalysis)
    }
  }

  return {
    nodeId: node.id,
    nodeName: node.name,
    nodeType: node.type,
    fills: extractFills(node),
    strokes: extractStrokes(node),
    width: 'width' in node ? Math.round(node.width) : 0,
    height: 'height' in node ? Math.round(node.height) : 0,
    children,
  }
}

export default async function buildNodeTree(
  node: SceneNode
): Promise<NodeAnalysis> {
  const variableMap = await getVariableMap()
  return buildNodeTreeRecursive(node, variableMap)
}
