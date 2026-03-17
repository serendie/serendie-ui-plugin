import {
  NodeStructure,
  ComponentProperty,
} from '../../../shared-src/models/PluginMessage'
import extractColorVariables from '../../lint/extractors/extractColorVariables'
import getVariableMap from '../../lint/extractors/getVariableMap'
import { ComponentKeysMap } from '../../../shared-src/models/ComponentKeys'

async function buildNodeStructureRecursive(
  node: SceneNode,
  variableMap: Map<string, string>,
  sdsComponentKeys: Set<string>
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
    isSDSComponent?: boolean
  }> => {
    if (node.type !== 'INSTANCE') return {}

    let componentName: string | undefined
    let isSDSComponent = false
    const componentProperties: ComponentProperty[] = []
    try {
      // NOTE: メインコンポーネントにアクセスできないとき、getMainComponentAsyncやcomponentPropertiesはエラーになる
      const mainComponent = await node.getMainComponentAsync()
      // NOTE: バリアントコンポーネントの場合、親のコンポーネントセット名を使用
      componentName =
        mainComponent?.parent?.type === 'COMPONENT_SET'
          ? mainComponent.parent.name
          : mainComponent?.name

      // SDSコンポーネントかどうかをkeyで判定
      const componentKey =
        mainComponent?.parent?.type === 'COMPONENT_SET'
          ? mainComponent.parent.key
          : mainComponent?.key
      isSDSComponent = componentKey ? sdsComponentKeys.has(componentKey) : false

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
      console.warn('メインコンポーネントの情報取得に失敗しました。')
    }

    return {
      componentName,
      componentProperties:
        componentProperties.length > 0 ? componentProperties : undefined,
      isSDSComponent,
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
        variableMap,
        sdsComponentKeys
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
  node: SceneNode,
  componentKeysMap: ComponentKeysMap
): Promise<NodeStructure> {
  const variableMap = await getVariableMap()
  const sdsComponentKeys = new Set(
    Object.values(componentKeysMap).map(component => component.key)
  )
  return buildNodeStructureRecursive(node, variableMap, sdsComponentKeys)
}
