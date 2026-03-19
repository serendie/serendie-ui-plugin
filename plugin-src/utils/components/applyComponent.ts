import {
  ComponentApplyTarget,
  ApplyComponentResult,
} from '../../../shared-src/models/PluginMessage'
import { ComponentKeysMap } from '../../../shared-src/models/ComponentKeys'
import { setInstanceProperties } from './setInstanceProperties'
import { detachAncestorInstances } from './detachAncestorInstances'
import {
  importComponentByKeyCached,
  importComponentSetByKeyCached,
} from './importComponentCached'
import getTreePath, { getNodeByTreePath } from '../nodes/getTreePath'
import { sortByDepthDescending } from '../nodes/sortByDepth'

/**
 * 選択要素内のノードを直接Serendie UIコンポーネントに置き換える
 */
export async function applyComponents(
  rootNodeId: string,
  targets: ComponentApplyTarget[],
  componentKeysMap: ComponentKeysMap
): Promise<{
  results: ApplyComponentResult[]
  detached: number
}> {
  const results: ApplyComponentResult[] = []

  const rootNode = await figma.getNodeByIdAsync(rootNodeId)
  if (!rootNode) {
    console.error(`Root node not found: ${rootNodeId}`)
    for (const target of targets) {
      results.push({ oldNodeId: target.nodeId, newNodeId: '', status: 'failed' })
    }
    return { results, detached: 0 }
  }

  // Step 1: 解体前にツリーパスを記録（並列取得）
  const treePathMap = new Map<string, number[]>()
  const nodes = await Promise.all(
    targets.map(t => figma.getNodeByIdAsync(t.nodeId))
  )
  for (let i = 0; i < targets.length; i++) {
    const node = nodes[i]
    if (!node) continue
    const path = getTreePath(node, rootNode)
    if (path) {
      treePathMap.set(targets[i].nodeId, path)
    }
  }

  // Step 2: 提案対象ノードの祖先にあるインスタンスを部分的に解体
  const detached = await detachAncestorInstances(
    targets.map(i => i.nodeId),
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
  const sortedTargets = await sortByDepthDescending(targets, async target => {
    return findNodeByTreePath(target.nodeId)
  })

  for (const item of sortedTargets) {
    try {
      // component-keys.json にないコンポーネントはスキップ
      const componentInfo = componentKeysMap[item.componentName]
      if (!componentInfo) {
        console.log(
          `Skipping: component not in Figma library: ${item.componentName}`
        )
        results.push({
          oldNodeId: item.nodeId,
          newNodeId: '',
          status: 'skipped',
        })
        continue
      }

      // ツリーパスで解体後のノードを取得
      const targetNode = findNodeByTreePath(item.nodeId)
      if (!targetNode || !('parent' in targetNode)) {
        console.warn(`Node not found for: ${item.nodeId}`)
        results.push({
          oldNodeId: item.nodeId,
          newNodeId: '',
          status: 'failed',
        })
        continue
      }

      // コンポーネントをインポート
      let instance: InstanceNode
      if (componentInfo.type === 'COMPONENT_SET') {
        const componentSet = await importComponentSetByKeyCached(
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
              item.componentName,
              componentKeysMap
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
        const component = await importComponentByKeyCached(
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
          try {
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
          } catch {
            // HUGなど、コンポーネントの構造上設定できない値は無視
          }
        }

        sceneNode.remove()
      }

      results.push({
        oldNodeId: item.nodeId,
        newNodeId: instance.id,
        status: 'success',
      })
    } catch (error) {
      console.error(`Failed to apply component: ${item.componentName}`, error)
      results.push({
        oldNodeId: item.nodeId,
        newNodeId: '',
        status: 'failed',
      })
    }
  }

  return { results, detached }
}
