import { getNodeDepth, sortByDepthDescending } from './sortByDepth'

type TestNode = {
  name: string
  parent: TestNode | null
}

function createTree(): {
  root: TestNode
  child0: TestNode
  child1: TestNode
  grandchild00: TestNode
  grandchild01: TestNode
  grandchild10: TestNode
} {
  const root: TestNode = { name: 'root', parent: null }
  const child0: TestNode = { name: 'child0', parent: root }
  const child1: TestNode = { name: 'child1', parent: root }
  const grandchild00: TestNode = { name: 'grandchild00', parent: child0 }
  const grandchild01: TestNode = { name: 'grandchild01', parent: child0 }
  const grandchild10: TestNode = { name: 'grandchild10', parent: child1 }

  return { root, child0, child1, grandchild00, grandchild01, grandchild10 }
}

describe('getNodeDepth', () => {
  const tree = createTree()

  it.each([
    [tree.root, 0],
    [tree.child0, 1],
    [tree.child1, 1],
    [tree.grandchild00, 2],
    [tree.grandchild01, 2],
    [tree.grandchild10, 2],
  ])('%s -> depth %d', (node, expected) => {
    expect(getNodeDepth(node)).toBe(expected)
  })

  it('nullの場合は0を返す', () => {
    expect(getNodeDepth(null)).toBe(0)
  })
})

describe('sortByDepthDescending', () => {
  const tree = createTree()

  it('深さ順にソートする（深い順）', async () => {
    const items = [
      { id: 'root', node: tree.root },
      { id: 'grandchild00', node: tree.grandchild00 },
      { id: 'child0', node: tree.child0 },
      { id: 'grandchild10', node: tree.grandchild10 },
      { id: 'child1', node: tree.child1 },
    ]

    const sorted = await sortByDepthDescending(items, item =>
      Promise.resolve(item.node)
    )
    const sortedIds = sorted.map(item => item.id)

    // 深さ2のノードが先、深さ1が次、深さ0が最後
    expect(sortedIds.indexOf('grandchild00')).toBeLessThan(
      sortedIds.indexOf('child0')
    )
    expect(sortedIds.indexOf('grandchild10')).toBeLessThan(
      sortedIds.indexOf('child1')
    )
    expect(sortedIds.indexOf('child0')).toBeLessThan(sortedIds.indexOf('root'))
  })

  it('空配列の場合は空配列を返す', async () => {
    const result = await sortByDepthDescending([], () => Promise.resolve(null))
    expect(result).toEqual([])
  })

  it('同じ深さのノードは元の順序を維持する', async () => {
    const items = [
      { id: 'grandchild00', node: tree.grandchild00 },
      { id: 'grandchild01', node: tree.grandchild01 },
      { id: 'grandchild10', node: tree.grandchild10 },
    ]

    const sorted = await sortByDepthDescending(items, item =>
      Promise.resolve(item.node)
    )
    const sortedIds = sorted.map(item => item.id)

    // 全て深さ2なので元の順序が維持される
    expect(sortedIds).toEqual(['grandchild00', 'grandchild01', 'grandchild10'])
  })
})
