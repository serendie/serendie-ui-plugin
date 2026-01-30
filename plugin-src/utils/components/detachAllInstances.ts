/**
 * コピー内のすべてのインスタンスを再帰的に解体
 * @param node 解体対象のノード
 * @param idMap 解体前後のIDマッピング（オプション）
 * @returns 解体後のノード
 */
export function detachAllInstances(
  node: SceneNode,
  idMap?: Map<string, string>
): SceneNode {
  if (node.type === 'INSTANCE') {
    const oldId = node.id
    const detached = node.detachInstance()
    // 解体前後のIDをマッピング
    if (idMap) {
      idMap.set(oldId, detached.id)
    }
    // 解体後のFrameの子も再帰的に処理
    if ('children' in detached) {
      for (let i = 0; i < detached.children.length; i++) {
        detachAllInstances(detached.children[i], idMap)
      }
    }
    return detached
  }
  if ('children' in node) {
    for (let i = 0; i < node.children.length; i++) {
      detachAllInstances(node.children[i], idMap)
    }
  }
  return node
}
