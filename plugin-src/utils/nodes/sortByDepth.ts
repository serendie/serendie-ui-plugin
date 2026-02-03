type NodeLike = {
  parent: NodeLike | null
}

/**
 * ノードの深さを取得する（ルートからの距離）
 * @param node 対象のノード
 * @returns 深さ（ルートは0）
 */
export function getNodeDepth(node: NodeLike | null): number {
  let depth = 0
  let current = node
  while (current && current.parent) {
    depth++
    current = current.parent
  }
  return depth
}

/**
 * アイテムを深さ順にソートする（深い順 = 子から親へ）
 * @param items ソート対象のアイテム
 * @param getNode アイテムからノードを非同期で取得する関数
 * @returns 深さ順にソートされたアイテム
 */
export async function sortByDepthDescending<T>(
  items: T[],
  getNode: (item: T) => Promise<NodeLike | null>
): Promise<T[]> {
  const itemsWithDepth = await Promise.all(
    items.map(async item => ({
      item,
      depth: getNodeDepth(await getNode(item)),
    }))
  )
  itemsWithDepth.sort((a, b) => b.depth - a.depth)
  return itemsWithDepth.map(x => x.item)
}
