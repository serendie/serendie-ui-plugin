import {
  NodeStructure,
  ComponentProperty,
} from '../../shared-src/models/PluginMessage'
import extractColorVariables from './extractColorVariables'
import getVariableMap from './getVariableMap'

async function buildNodeStructureRecursive(
  node: SceneNode,
  variableMap: Map<string, string>
): Promise<NodeStructure> {
  const extractFills = (node: SceneNode): string[] => {
    if ('fills' in node) {
      return extractColorVariables(node.fills, variableMap)
    }
    return []
  }

  const extractStrokes = (node: SceneNode): string[] => {
    if ('strokes' in node) {
      return extractColorVariables(node.strokes, variableMap)
    }
    return []
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

  const extractTextContent = (node: SceneNode): string | undefined => {
    if (node.type !== 'TEXT') return undefined
    return node.characters
  }

  const extractInstanceInfo = async (
    node: SceneNode
  ): Promise<{
    componentName?: string
    componentProperties?: ComponentProperty[]
  }> => {
    if (node.type !== 'INSTANCE') return {}

    let componentName: string | undefined
    const componentProperties: ComponentProperty[] = []
    try {
      // NOTE: メインコンポーネントにアクセスできないとき、getMainComponentAsyncやcomponentPropertiesはエラーになる
      const mainComponent = await node.getMainComponentAsync()
      // NOTE: バリアントコンポーネントの場合、親のコンポーネントセット名を使用
      componentName =
        mainComponent?.parent?.type === 'COMPONENT_SET'
          ? mainComponent.parent.name
          : mainComponent?.name
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
    } catch {
      console.error('コンポーネントの情報取得に失敗しました。')
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
    textContent: extractTextContent(node),
    ...instanceInfo,
  }
}

export default async function buildNodeStructure(
  node: SceneNode
): Promise<NodeStructure> {
  const variableMap = await getVariableMap()
  return buildNodeStructureRecursive(node, variableMap)
}
