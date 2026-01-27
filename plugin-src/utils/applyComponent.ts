import { ApplyComponentItem } from '../../shared-src/models/PluginMessage'
import { ComponentKeysMap } from '../../shared-src/models/ComponentKeys'
import { getBasePropName } from '../../shared-src/utils/getBasePropName'
import componentKeys from '../../assets/component-keys.json'

const componentKeysMap = componentKeys as ComponentKeysMap

const COPY_GAP = 20 // コピー配置時のギャップ（px）

/**
 * ネストしたプロパティかどうかを判定
 * 形式: "Path/To/Instance.PropertyName"
 */
function isNestedProperty(key: string): boolean {
  return key.includes('/') && key.includes('.')
}

/**
 * ネストしたプロパティをパース
 */
function parseNestedProperty(
  key: string
): { path: string[]; propName: string } | null {
  const dotIndex = key.lastIndexOf('.')
  if (dotIndex === -1) return null
  const pathPart = key.slice(0, dotIndex)
  const propName = key.slice(dotIndex + 1)
  return { path: pathPart.split('/'), propName }
}

// SerendieSymbols系のフォールバック候補（互換性があるため）
const SYMBOL_FALLBACKS: Record<string, string[]> = {
  OutlinedSerendieSymbols: ['FilledSerendieSymbols', 'SerendieSymbols'],
  FilledSerendieSymbols: ['OutlinedSerendieSymbols', 'SerendieSymbols'],
  SerendieSymbols: ['OutlinedSerendieSymbols', 'FilledSerendieSymbols'],
}

/**
 * 指定した名前のノードを再帰的に探索（最初に見つかったものを返す）
 * SerendieSymbols系のコンポーネントは互換性があるため、フォールバックを試みる
 */
function findDescendantByName(
  node: SceneNode,
  name: string
): SceneNode | undefined {
  if (!('children' in node)) return undefined

  // 検索する名前のリストを作成（元の名前 + フォールバック）
  const namesToSearch = [name, ...(SYMBOL_FALLBACKS[name] || [])]

  for (const child of (node as FrameNode | InstanceNode).children) {
    // フォールバック含めてマッチするかチェック
    if (namesToSearch.includes(child.name)) return child
    const found = findDescendantByName(child, name)
    if (found) return found
  }
  return undefined
}

/**
 * ネストしたプロパティを適用
 * パスを厳密にたどってターゲットインスタンスを見つけ、プロパティを設定する
 */
function applyNestedProperties(
  instance: InstanceNode,
  nestedProps: Record<string, string | boolean | number>
): void {
  for (const [key, value] of Object.entries(nestedProps)) {
    const parsed = parseNestedProperty(key)
    if (!parsed) continue

    // パスの各要素を順番に再帰的に探索
    let current: SceneNode = instance
    let found = true

    for (const name of parsed.path) {
      const child = findDescendantByName(current, name)
      if (!child) {
        console.warn(`Nested property path not found: ${key} (looking for ${name})`)
        found = false
        break
      }
      current = child
    }

    if (!found) continue

    // ターゲットがINSTANCEの場合、プロパティを変更
    if (current.type === 'INSTANCE') {
      try {
        current.setProperties({ [parsed.propName]: String(value) })
      } catch (e) {
        console.warn(`Failed to set nested property: ${key}`, e)
      }
    } else {
      console.warn(`Nested property target is not an INSTANCE: ${key} (type: ${current.type})`)
    }
  }
}

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
            // INSTANCE_SWAPは後で別途処理
            const instanceSwapProps: Array<{ propName: string; componentKey: string }> = []
            // ネストしたプロパティは後で別途処理
            const nestedProps: Record<string, string | boolean | number> = {}

            for (const [key, value] of Object.entries(item.properties)) {
              // ネストしたプロパティ（Path/To/Instance.Property形式）は別途処理
              if (isNestedProperty(key)) {
                nestedProps[key] = value
                continue
              }

              // プロパティ名のマッチング（#以降のIDを無視して比較）
              // 例: "Show Label#25710:0" は "Show Label" としてマッチ
              const propDef = componentInfo.componentProperties?.find(
                p => getBasePropName(p.name).toLowerCase() === key.toLowerCase()
              )
              if (!propDef) {
                // 定義されていないプロパティはスキップ（AIが存在しないプロパティを提案した場合）
                console.warn(
                  `Skipping unknown property for ${item.componentName}: ${key}`
                )
                continue
              }

              switch (propDef.type) {
                case 'VARIANT': {
                  // VARIANTの場合、オプションから大文字小文字を無視してマッチング
                  const strValue = String(value)
                  let matched = propDef.options.find(
                    opt => opt.toLowerCase() === strValue.toLowerCase()
                  )

                  // 完全一致しない場合、数値オプションなら最も近い値にフォールバック
                  if (!matched) {
                    const numValue = Number(value)
                    if (!isNaN(numValue)) {
                      const numericOptions = propDef.options
                        .map(opt => ({ opt, num: Number(opt) }))
                        .filter(x => !isNaN(x.num))
                      if (numericOptions.length > 0) {
                        const closest = numericOptions.reduce((a, b) =>
                          Math.abs(b.num - numValue) < Math.abs(a.num - numValue)
                            ? b
                            : a
                        )
                        matched = closest.opt
                        console.log(
                          `Variant value ${value} not found, using closest: ${matched}`
                        )
                      }
                    }
                  }

                  // マッチしない場合はスキップ（存在しないバリアントでエラーになるため）
                  if (matched) {
                    normalizedProps[propDef.name] = matched
                  } else {
                    console.warn(
                      `Skipping invalid variant value for ${propDef.name}: ${value}`
                    )
                  }
                  break
                }
                case 'BOOLEAN':
                  normalizedProps[propDef.name] =
                    value === true || value === 'true' || value === 'True'
                  break
                case 'TEXT':
                  normalizedProps[propDef.name] = String(value)
                  break
                case 'INSTANCE_SWAP': {
                  // "ComponentSetName/VariantValue" 形式をパース
                  const strValue = String(value)
                  const slashIndex = strValue.indexOf('/')
                  if (slashIndex === -1) continue

                  const componentSetName = strValue.slice(0, slashIndex)
                  const variantValue = strValue.slice(slashIndex + 1)

                  // Component Setのキーを取得
                  const targetComponentSet = componentKeysMap[componentSetName]
                  if (
                    !targetComponentSet ||
                    targetComponentSet.type !== 'COMPONENT_SET'
                  )
                    continue

                  // Component Setをインポートしてバリアントを取得
                  const importedSet = await figma.importComponentSetByKeyAsync(
                    targetComponentSet.key
                  )
                  // バリアント名でマッチング（例: "Name=arrow_back"）
                  const variantComponent = importedSet.children.find(child => {
                    if (child.type !== 'COMPONENT') return false
                    // バリアント名は "Name=value" または "Prop1=val1, Prop2=val2" 形式
                    return child.name
                      .split(', ')
                      .some(
                        part =>
                          part.toLowerCase() ===
                          `name=${variantValue.toLowerCase()}`
                      )
                  }) as ComponentNode | undefined

                  if (variantComponent) {
                    instanceSwapProps.push({
                      propName: propDef.name,
                      componentKey: variantComponent.key,
                    })
                  }
                  break
                }
              }
            }

            // VARIANT/BOOLEAN/TEXTを適用
            if (Object.keys(normalizedProps).length > 0) {
              instance.setProperties(normalizedProps)
            }

            // INSTANCE_SWAPを適用（コンポーネントキーを使用）
            for (const { propName, componentKey } of instanceSwapProps) {
              const swappedComponent =
                await figma.importComponentByKeyAsync(componentKey)
              instance.setProperties({
                [propName]: swappedComponent.id,
              })
            }

            // ネストしたプロパティを適用
            if (Object.keys(nestedProps).length > 0) {
              applyNestedProperties(instance, nestedProps)
            }
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
