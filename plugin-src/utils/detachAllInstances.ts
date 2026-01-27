/**
 * コピー内のすべてのインスタンスを再帰的に解体
 */
export function detachAllInstances(node: SceneNode): SceneNode {
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
