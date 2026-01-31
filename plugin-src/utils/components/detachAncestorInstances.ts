import { getNodeDepth } from '../nodes/sortByDepth'

type NodeLike = {
  id: string
  type: string
  parent: NodeLike | null
}

type InstanceLike = NodeLike & {
  type: 'INSTANCE'
  detachInstance: () => NodeLike
}

function isInstance(node: NodeLike): node is InstanceLike {
  return node.type === 'INSTANCE'
}

/**
 * 提案対象ノードの祖先にあるインスタンスを部分的に解体する
 * @param nodeIds 提案対象ノードのID一覧
 * @param rootNodeId 探索を停止するルートノードのID
 * @param getNodeById ノードIDからノードを取得する関数
 * @returns 解体したインスタンスの数
 */
export async function detachAncestorInstances(
  nodeIds: string[],
  rootNodeId: string,
  getNodeById: (id: string) => Promise<NodeLike | null>
): Promise<number> {
  const instanceIds = new Set<string>()

  // 各ノードの祖先チェーンからインスタンスを収集
  for (const nodeId of nodeIds) {
    let current = await getNodeById(nodeId)
    while (current && current.id !== rootNodeId) {
      if (current.type === 'INSTANCE') {
        instanceIds.add(current.id)
      }
      current = current.parent
    }
  }

  if (instanceIds.size === 0) return 0

  // 浅い順（ルートに近い方から）にソートして解体
  const instances: { id: string; depth: number }[] = []
  for (const id of instanceIds) {
    const node = await getNodeById(id)
    if (node) {
      instances.push({ id, depth: getNodeDepth(node) })
    }
  }
  instances.sort((a, b) => a.depth - b.depth)

  let count = 0
  for (const { id } of instances) {
    const node = await getNodeById(id)
    if (!node || !isInstance(node)) continue
    node.detachInstance()
    count++
  }

  return count
}
