import { ApplyComponentItem } from '../../shared-src/models/PluginMessage'
import componentKeys from '../../assets/component-keys.json'

type ComponentKeyInfo = {
  key: string
  name: string
  description: string
  nodeId: string
  type: 'COMPONENT' | 'COMPONENT_SET'
}

const componentKeysMap = componentKeys as Record<string, ComponentKeyInfo>

/**
 * ノードがインスタンス内にあるかチェック
 */
function isInsideInstance(node: BaseNode | null): boolean {
  let current = node
  while (current) {
    if (current.type === 'INSTANCE') {
      return true
    }
    current = current.parent
  }
  return false
}

/**
 * 指定されたノードをSerendie UIコンポーネントに置き換える
 */
export async function applyComponents(
  items: ApplyComponentItem[]
): Promise<{ success: number; failed: number; skipped: number }> {
  let success = 0
  let failed = 0
  let skipped = 0

  for (const item of items) {
    try {
      // ネストされたインスタンスノード（`;` を含むID）はスキップ
      if (item.nodeId.includes(';')) {
        console.log(`Skipping nested instance node: ${item.nodeId}`)
        skipped++
        continue
      }

      // component-keys.json にないコンポーネントはスキップ
      const componentInfo = componentKeysMap[item.componentName]
      if (!componentInfo) {
        console.log(
          `Skipping: component not in Figma library: ${item.componentName}`
        )
        skipped++
        continue
      }

      const targetNode = await figma.getNodeByIdAsync(item.nodeId)
      if (!targetNode || !('parent' in targetNode)) {
        console.warn(`Node not found: ${item.nodeId}`)
        failed++
        continue
      }

      // 親がインスタンス内の場合はスキップ（インスタンス内のノードは編集不可）
      const parent = targetNode.parent
      if (isInsideInstance(parent)) {
        console.log(`Skipping node inside instance: ${item.nodeId}`)
        skipped++
        continue
      }

      // コンポーネントをインポート
      let instance: InstanceNode
      if (componentInfo.type === 'COMPONENT_SET') {
        // コンポーネントセットの場合、デフォルトバリアントを使用
        const componentSet = await figma.importComponentSetByKeyAsync(
          componentInfo.key
        )
        instance = componentSet.defaultVariant.createInstance()
      } else {
        // 単一コンポーネントの場合
        const component = await figma.importComponentByKeyAsync(
          componentInfo.key
        )
        instance = component.createInstance()
      }

      // 元のノードの位置とサイズをコピー
      const sceneNode = targetNode as SceneNode
      instance.x = sceneNode.x
      instance.y = sceneNode.y

      // 親ノードに挿入（元のノードと同じ位置）
      const sceneParent = sceneNode.parent
      if (sceneParent && 'children' in sceneParent) {
        const index = sceneParent.children.indexOf(sceneNode)
        sceneParent.insertChild(index, instance)
        // 元のノードを削除
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
