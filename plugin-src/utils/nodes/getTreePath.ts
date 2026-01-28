type TreeNode = {
  parent: TreeNode | null
  children?: readonly TreeNode[]
}

/**
 * ノードからルートまでのツリーパス（インデックスの配列）を計算する
 * @param node 対象のノード
 * @param root ルートノード
 * @returns ルートからnodeまでのインデックスパス（例: [0, 2, 1]）。到達できない場合はnull
 */
export default function getTreePath(
  node: TreeNode,
  root: TreeNode
): number[] | null {
  const path: number[] = []
  let current: TreeNode | null = node
  while (current && current !== root) {
    const parentNode: TreeNode | null = current.parent
    if (!parentNode || !parentNode.children) return null
    const index = parentNode.children.indexOf(current)
    if (index === -1) return null
    path.unshift(index)
    current = parentNode
  }
  return current === root ? path : null
}

/**
 * ツリーパスからノードを取得する
 * @param root ルートノード
 * @param path インデックスパス
 * @returns パスに対応するノード。見つからない場合はnull
 */
export function getNodeByTreePath<T extends TreeNode>(
  root: T,
  path: number[]
): T | null {
  let current: T = root
  for (const index of path) {
    if (!current.children) return null
    if (index >= current.children.length) return null
    current = current.children[index] as T
  }
  return current
}
