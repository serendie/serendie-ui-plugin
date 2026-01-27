import { ApplyComponentItem } from '../../shared-src/models/PluginMessage'
import { ComponentKeysMap } from '../../shared-src/models/ComponentKeys'
import componentKeys from '../../assets/component-keys.json'

const componentKeysMap = componentKeys as ComponentKeysMap

const COPY_GAP = 20 // コピー配置時のギャップ（px）

/**
 * コピー内のすべてのインスタンスを再帰的に解体
 */
function detachAllInstances(node: SceneNode): SceneNode {
  if (node.type === 'INSTANCE') {
    const detached = node.detachInstance()
    // 解体後のFrameの子も再帰的に処理
    if ('children' in detached) {
      for (let i = 0; i < detached.children.length; i++) {
        detachAllInstances(detached.children[i])
      }
    }
    return detached
  }
  if ('children' in node) {
    for (let i = 0; i < node.children.length; i++) {
      detachAllInstances(node.children[i])
    }
  }
  return node
}

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

  // Step 4: 解体後にIDリストを取得（両方とも解体後の構造で取得）
  // 元のノードも同様にインスタンスを解体した状態でIDを取得する必要がある
  // → 代わりに、ノード名でマッチングする方式に変更

  // 元のノードとコピー後のノードをペアリング（ツリー構造の同じ位置でマッチング）
  const idMap = new Map<string, string>()
  function buildIdMapByTreePosition(
    original: SceneNode,
    clonedNode: SceneNode
  ) {
    idMap.set(original.id, clonedNode.id)
    if ('children' in original && 'children' in clonedNode) {
      const origChildren = original.children
      const clonedChildren = clonedNode.children
      // インスタンス解体で子の数が変わる可能性があるので、最小値を使用
      const minLen = Math.min(origChildren.length, clonedChildren.length)
      for (let i = 0; i < minLen; i++) {
        buildIdMapByTreePosition(origChildren[i], clonedChildren[i])
      }
    }
  }
  buildIdMapByTreePosition(rootNode as SceneNode, cloned)

  // Step 5: 各アイテムをコピー内で置き換え
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

      // 元のnodeIdからコピー内のnodeIdを取得
      const clonedNodeId = idMap.get(item.nodeId)
      if (!clonedNodeId) {
        console.warn(`Node ID mapping not found: ${item.nodeId}`)
        failed++
        continue
      }

      const targetNode = await figma.getNodeByIdAsync(clonedNodeId)
      if (!targetNode || !('parent' in targetNode)) {
        console.warn(`Cloned node not found: ${clonedNodeId}`)
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

        // プロパティ指定がある場合はsetProperties()で変更
        if (item.properties && Object.keys(item.properties).length > 0) {
          try {
            // AIが返した値を正しいオプション値に正規化（大文字小文字を無視してマッチング）
            const normalizedProps: Record<string, string | boolean> = {}
            for (const [key, value] of Object.entries(item.properties)) {
              const propDef = componentInfo.componentProperties?.find(
                (p): p is typeof p & { type: 'VARIANT'; options: string[] } =>
                  p.name.toLowerCase() === key.toLowerCase() &&
                  p.type === 'VARIANT'
              )
              if (propDef) {
                // VARIANTの場合、オプションから大文字小文字を無視してマッチング
                const matched = propDef.options.find(
                  opt => opt.toLowerCase() === String(value).toLowerCase()
                )
                normalizedProps[propDef.name] = matched ?? String(value)
              } else {
                // BOOLEAN/TEXTの場合はそのまま
                const booleanOrTextProp = componentInfo.componentProperties?.find(
                  p =>
                    p.name.toLowerCase() === key.toLowerCase() &&
                    (p.type === 'BOOLEAN' || p.type === 'TEXT')
                )
                if (booleanOrTextProp) {
                  normalizedProps[booleanOrTextProp.name] =
                    booleanOrTextProp.type === 'BOOLEAN'
                      ? value === true || value === 'true' || value === 'True'
                      : String(value)
                } else {
                  normalizedProps[key] = value
                }
              }
            }
            instance.setProperties(normalizedProps)
          } catch (e) {
            // 無効なプロパティ指定の場合はデフォルトのまま続行
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

      // 元のノードの位置をコピー
      const sceneNode = targetNode as SceneNode
      instance.x = sceneNode.x
      instance.y = sceneNode.y

      // 親ノードに挿入（元のノードと同じ位置）
      const parent = sceneNode.parent
      if (parent && 'children' in parent) {
        const index = parent.children.indexOf(sceneNode)
        parent.insertChild(index, instance)
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
