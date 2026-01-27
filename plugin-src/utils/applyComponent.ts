import { ApplyComponentItem } from '../../shared-src/models/PluginMessage'
import { ComponentKeysMap } from '../../shared-src/models/ComponentKeys'
import { detachAllInstances } from './detachAllInstances'
import { setInstanceProperties } from './setInstanceProperties'
import componentKeys from '../../assets/component-keys.json'

const componentKeysMap = componentKeys as ComponentKeysMap

const COPY_GAP = 20 // コピー配置時のギャップ（px）

/**
 * 選択要素をコピーし、コピー内でSerendie UIコンポーネントに置き換える
 */
export async function applyComponents(
  rootNodeId: string,
  items: ApplyComponentItem[]
): Promise<{ success: number; failed: number; skipped: number }> {
  let success = 0
  let failed = 0
  let skipped = 0

  // Step 1: ルートノードを取得
  const rootNode = await figma.getNodeByIdAsync(rootNodeId)
  if (!rootNode || !('clone' in rootNode)) {
    console.error(`Root node not found: ${rootNodeId}`)
    return { success: 0, failed: items.length, skipped: 0 }
  }

  // Step 2: ルートノードをコピー
  const cloned = (rootNode as SceneNode).clone()
  cloned.name = `${cloned.name}（プレビュー）`
  const bounds = (rootNode as SceneNode).absoluteBoundingBox
  if (bounds) {
    cloned.x = bounds.x + bounds.width + COPY_GAP
    cloned.y = bounds.y
  }
  figma.currentPage.appendChild(cloned)

  // Step 3: コピー内のインスタンスをすべて解体
  detachAllInstances(cloned)

  // Step 4: ノードのツリーパスを計算する関数
  // ルートからのインデックスパスを返す（例: [0, 2, 1]）
  function getTreePath(node: BaseNode, root: BaseNode): number[] | null {
    const path: number[] = []
    let current: BaseNode | null = node
    while (current && current !== root) {
      const parentNode: BaseNode | null = current.parent
      if (!parentNode || !('children' in parentNode)) return null
      const index = (parentNode.children as readonly SceneNode[]).indexOf(
        current as SceneNode
      )
      if (index === -1) return null
      path.unshift(index)
      current = parentNode
    }
    return current === root ? path : null
  }

  // Step 5: ツリーパスからノードを取得する関数
  function getNodeByTreePath(
    root: SceneNode,
    path: number[]
  ): SceneNode | null {
    let current: SceneNode = root
    for (const index of path) {
      if (!('children' in current)) return null
      const children = current.children as readonly SceneNode[]
      if (index >= children.length) return null
      current = children[index]
    }
    return current
  }

  // Step 6: 元のノードからツリーパスを計算し、コピー内の対応ノードを取得
  async function findClonedNode(
    originalNodeId: string
  ): Promise<SceneNode | null> {
    const originalNode = await figma.getNodeByIdAsync(originalNodeId)
    if (!originalNode) return null

    const treePath = getTreePath(originalNode, rootNode as BaseNode)
    if (!treePath) return null

    return getNodeByTreePath(cloned, treePath)
  }

  // Step 7: 各アイテムをコピー内で置き換え
  // 親を先に置き換えると子が消えてエラーが発生するため、深い階層から処理する

  // ノードの深さを取得する関数
  async function getNodeDepth(nodeId: string): Promise<number> {
    let depth = 0
    let node = await figma.getNodeByIdAsync(nodeId)
    while (node && node.parent) {
      depth++
      node = node.parent
    }
    return depth
  }

  // itemsを深さ順にソート（深い順 = 子から親へ）
  const itemsWithDepth = await Promise.all(
    items.map(async item => ({
      item,
      depth: await getNodeDepth(item.nodeId),
    }))
  )
  itemsWithDepth.sort((a, b) => b.depth - a.depth)
  const sortedItems = itemsWithDepth.map(x => x.item)

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

      // 元のnodeIdからコピー内の対応ノードを取得
      const targetNode = await findClonedNode(item.nodeId)
      if (!targetNode || !('parent' in targetNode)) {
        console.warn(`Cloned node not found for: ${item.nodeId}`)
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

      // サイズを元のノードに合わせる（リサイズ可能な場合）
      try {
        instance.resize(sceneNode.width, sceneNode.height)
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

  return { success, failed, skipped }
}
