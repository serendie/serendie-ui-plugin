import {
  NodeStructure,
  ComponentProperty,
} from '../../shared-src/models/PluginMessage'
import extractVariableKey from './extractVariableKey'
import getVariableMap from './getVariableMap'

async function buildNodeStructureRecursive(
  node: SceneNode,
  variableMap: Map<string, string>
): Promise<NodeStructure> {
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

  const extractTextStyle = async (
    node: SceneNode
  ): Promise<string | undefined> => {
    if (node.type !== 'TEXT') return undefined
    const textStyleId = node.textStyleId
    if (textStyleId && typeof textStyleId === 'string') {
      const style = await figma.getStyleByIdAsync(textStyleId)
      if (style) {
        return style.name
      }
    }
    return undefined
  }

  const extractInstanceInfo = async (
    node: SceneNode
  ): Promise<{
    componentName?: string
    componentProperties?: ComponentProperty[]
  }> => {
    if (node.type !== 'INSTANCE') return {}

    const mainComponent = await node.getMainComponentAsync()
    // バリアントコンポーネントの場合、親のコンポーネントセット名を使用
    const componentName =
      mainComponent?.parent?.type === 'COMPONENT_SET'
        ? mainComponent.parent.name
        : mainComponent?.name

    const componentProperties: ComponentProperty[] = []
    const props = node.componentProperties
    if (props) {
      for (const [name, prop] of Object.entries(props)) {
        componentProperties.push({
          name,
          type: prop.type,
          value: prop.value,
        })
      }
    }

    return {
      componentName,
      componentProperties:
        componentProperties.length > 0 ? componentProperties : undefined,
    }
  }

  const children: NodeStructure[] = []
  if ('children' in node && node.visible) {
    for (const child of node.children) {
      if (!child.visible) {
        continue
      }

      const childStructure = await buildNodeStructureRecursive(
        child,
        variableMap
      )
      children.push(childStructure)
    }
  }

  const instanceInfo = await extractInstanceInfo(node)

  return {
    nodeId: node.id,
    nodeName: node.name,
    nodeType: node.type,
    fills: extractFills(node),
    strokes: extractStrokes(node),
    width: 'width' in node ? Math.round(node.width) : 0,
    height: 'height' in node ? Math.round(node.height) : 0,
    children,
    textStyle: await extractTextStyle(node),
    ...instanceInfo,
  }
}

export default async function buildNodeStructure(
  node: SceneNode
): Promise<NodeStructure> {
  const variableMap = await getVariableMap()
  return buildNodeStructureRecursive(node, variableMap)
}
