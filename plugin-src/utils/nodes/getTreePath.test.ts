import getTreePath, { getNodeByTreePath } from './getTreePath'

type TestNode = {
  name: string
  parent: TestNode | null
  children?: TestNode[]
}

function createTree(): TestNode {
  const root: TestNode = { name: 'root', parent: null, children: [] }
  const child0: TestNode = { name: 'child0', parent: root, children: [] }
  const child1: TestNode = { name: 'child1', parent: root, children: [] }
  const grandchild00: TestNode = {
    name: 'grandchild00',
    parent: child0,
    children: [],
  }
  const grandchild01: TestNode = {
    name: 'grandchild01',
    parent: child0,
    children: [],
  }
  const grandchild10: TestNode = {
    name: 'grandchild10',
    parent: child1,
    children: [],
  }

  root.children = [child0, child1]
  child0.children = [grandchild00, grandchild01]
  child1.children = [grandchild10]

  return root
}

describe('getTreePath', () => {
  const root = createTree()
  const child0 = root.children![0]
  const child1 = root.children![1]
  const grandchild00 = child0.children![0]
  const grandchild01 = child0.children![1]
  const grandchild10 = child1.children![0]

  it.each([
    [root, []],
    [child0, [0]],
    [child1, [1]],
    [grandchild00, [0, 0]],
    [grandchild01, [0, 1]],
    [grandchild10, [1, 0]],
  ])('%s -> %j', (node, expected) => {
    expect(getTreePath(node, root)).toEqual(expected)
  })

  it('ルートに到達できない場合はnullを返す', () => {
    const orphan: TestNode = { name: 'orphan', parent: null }
    expect(getTreePath(orphan, root)).toBeNull()
  })

  it('別のツリーのノードの場合はnullを返す', () => {
    const otherRoot: TestNode = {
      name: 'otherRoot',
      parent: null,
      children: [],
    }
    const otherChild: TestNode = { name: 'otherChild', parent: otherRoot }
    otherRoot.children = [otherChild]
    expect(getTreePath(otherChild, root)).toBeNull()
  })
})

describe('getNodeByTreePath', () => {
  const root = createTree()

  it.each([
    [[], 'root'],
    [[0], 'child0'],
    [[1], 'child1'],
    [[0, 0], 'grandchild00'],
    [[0, 1], 'grandchild01'],
    [[1, 0], 'grandchild10'],
  ])('path %j -> %s', (path, expectedName) => {
    const node = getNodeByTreePath(root, path)
    expect(node?.name).toBe(expectedName)
  })

  it('存在しないパスの場合はnullを返す', () => {
    expect(getNodeByTreePath(root, [5])).toBeNull()
    expect(getNodeByTreePath(root, [0, 5])).toBeNull()
    expect(getNodeByTreePath(root, [0, 0, 0])).toBeNull()
  })
})
