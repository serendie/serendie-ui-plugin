import { ApplyComponentItem } from '../../../shared-src/models/PluginMessage'
import { ComponentKeysMap } from '../../../shared-src/models/ComponentKeys'
import { setInstanceProperties } from './setInstanceProperties'
import { detachAncestorInstances } from './detachAncestorInstances'
import getTreePath, { getNodeByTreePath } from '../nodes/getTreePath'
import { sortByDepthDescending } from '../nodes/sortByDepth'
import componentKeys from '../../../shared-src/assets/component-keys.json'

const componentKeysMap = componentKeys as ComponentKeysMap

/**
 * 選択要素内のノードを直接Serendie UIコンポーネントに置き換える
 */
export async function applyComponents(
  rootNodeId: string,
  items: ApplyComponentItem[]
): Promise<{
  success: number
  failed: number
  skipped: number
  detached: number
}> {
  let success = 0
  let failed = 0
  let skipped = 0

  const rootNode = await figma.getNodeByIdAsync(rootNodeId)
  if (!rootNode) {
    console.error(`Root node not found: ${rootNodeId}`)
    return { success: 0, failed: items.length, skipped: 0, detached: 0 }
  }

  // Step 1: 解体前にツリーパスを記録
  const treePathMap = new Map<string, number[]>()
  for (const item of items) {
    const node = await figma.getNodeByIdAsync(item.nodeId)
    if (!node) continue
    const path = getTreePath(node, rootNode)
    if (path) {
      treePathMap.set(item.nodeId, path)
    }
  }

  // Step 2: 提案対象ノードの祖先にあるインスタンスを部分的に解体
  const detached = await detachAncestorInstances(
    items.map(i => i.nodeId),
    rootNodeId,
    id => figma.getNodeByIdAsync(id)
  )

  // Step 3: ツリーパスから解体後のノードを取得する関数
  function findNodeByTreePath(nodeId: string): SceneNode | null {
    const path = treePathMap.get(nodeId)
    if (!path) return null
    return getNodeByTreePath(rootNode as SceneNode, path)
  }

  // Step 4: 深い階層から処理（親を先に置き換えると子が消えるため）
  const sortedItems = await sortByDepthDescending(items, async item => {
    return findNodeByTreePath(item.nodeId)
  })

  for (const item of sortedItems) {
    try {
      // component-keys.json にないコンポーネントはスキップ
      const componentInfo = componentKeysMap[item.componentName]
      if (!componentInfo) {
        console.log(
          `Skipping: component not in Figma library: ${item.componentName}`
        )
        skipped++
        continue
      }

      // ツリーパスで解体後のノードを取得
      const targetNode = findNodeByTreePath(item.nodeId)
      if (!targetNode || !('parent' in targetNode)) {
        console.warn(`Node not found for: ${item.nodeId}`)
        failed++
        continue
      }

      // コンポーネントをインポート
      let instance: InstanceNode
      if (componentInfo.type === 'COMPONENT_SET') {
        const componentSet = await figma.importComponentSetByKeyAsync(
          componentInfo.key
        )
        instance = componentSet.defaultVariant.createInstance()

        // プロパティ指定がある場合は適用
        if (item.properties && Object.keys(item.properties).length > 0) {
          try {
            await setInstanceProperties(
              instance,
              item.properties,
              componentInfo,
              item.componentName
            )
          } catch (e) {
            console.warn(
              `Invalid properties for ${item.componentName}:`,
              item.properties,
              e
            )
          }
        }
      } else {
        const component = await figma.importComponentByKeyAsync(
          componentInfo.key
        )
        instance = component.createInstance()
      }

      // 元のノードの位置とサイズをコピー
      const sceneNode = targetNode as SceneNode
      instance.x = sceneNode.x
      instance.y = sceneNode.y

      // 横幅を元のノードに合わせる（リサイズ可能な場合）
      try {
        instance.resize(sceneNode.width, instance.height)
      } catch {
        // リサイズできない場合は無視（固定サイズのコンポーネントなど）
      }

      // 親ノードに挿入（元のノードと同じ位置）
      const parent = sceneNode.parent
      if (parent && 'children' in parent) {
        const index = parent.children.indexOf(sceneNode)
        parent.insertChild(index, instance)

        // Auto Layout内の場合、レイアウト設定を継承
        if ('layoutMode' in parent && parent.layoutMode !== 'NONE') {
          // 元のノードのレイアウト設定を継承
          if ('layoutPositioning' in sceneNode) {
            instance.layoutPositioning = sceneNode.layoutPositioning
          }
          if (
            'layoutSizingHorizontal' in sceneNode &&
            'layoutSizingHorizontal' in instance
          ) {
            instance.layoutSizingHorizontal = sceneNode.layoutSizingHorizontal
          }
          if (
            'layoutSizingVertical' in sceneNode &&
            'layoutSizingVertical' in instance
          ) {
            instance.layoutSizingVertical = sceneNode.layoutSizingVertical
          }
        }

        sceneNode.remove()
      }

      success++
    } catch (error) {
      console.error(`Failed to apply component: ${item.componentName}`, error)
      failed++
    }
  }

  return { success, failed, skipped, detached }
}
