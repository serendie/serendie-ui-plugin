import { detachAncestorInstances } from './detachAncestorInstances'

type MockNode = {
  id: string
  type: string
  parent: MockNode | null
  detachInstance?: jest.Mock
}

function createGetNodeById(nodeMap: Map<string, MockNode>) {
  return (id: string) => Promise.resolve(nodeMap.get(id) ?? null)
}

describe('detachAncestorInstances', () => {
  it('祖先にインスタンスがない場合は0を返す', async () => {
    // root > frame > target
    const root: MockNode = { id: 'root', type: 'FRAME', parent: null }
    const frame: MockNode = { id: 'frame', type: 'FRAME', parent: root }
    const target: MockNode = { id: 'target', type: 'FRAME', parent: frame }

    const nodeMap = new Map<string, MockNode>([
      ['root', root],
      ['frame', frame],
      ['target', target],
    ])

    const result = await detachAncestorInstances(
      ['target'],
      'root',
      createGetNodeById(nodeMap)
    )
    expect(result).toBe(0)
  })

  it('祖先に1つのインスタンスがある場合は解体して1を返す', async () => {
    // root > instance > target
    const root: MockNode = { id: 'root', type: 'FRAME', parent: null }
    const instance: MockNode = {
      id: 'inst1',
      type: 'INSTANCE',
      parent: root,
      detachInstance: jest.fn(),
    }
    const target: MockNode = { id: 'target', type: 'FRAME', parent: instance }

    const nodeMap = new Map<string, MockNode>([
      ['root', root],
      ['inst1', instance],
      ['target', target],
    ])

    const result = await detachAncestorInstances(
      ['target'],
      'root',
      createGetNodeById(nodeMap)
    )
    expect(result).toBe(1)
    expect(instance.detachInstance).toHaveBeenCalledTimes(1)
  })

  it('複数のitemが同じ祖先インスタンスを共有する場合は1回だけ解体', async () => {
    // root > instance > target1, target2
    const root: MockNode = { id: 'root', type: 'FRAME', parent: null }
    const instance: MockNode = {
      id: 'inst1',
      type: 'INSTANCE',
      parent: root,
      detachInstance: jest.fn(),
    }
    const target1: MockNode = {
      id: 'target1',
      type: 'FRAME',
      parent: instance,
    }
    const target2: MockNode = {
      id: 'target2',
      type: 'FRAME',
      parent: instance,
    }

    const nodeMap = new Map<string, MockNode>([
      ['root', root],
      ['inst1', instance],
      ['target1', target1],
      ['target2', target2],
    ])

    const result = await detachAncestorInstances(
      ['target1', 'target2'],
      'root',
      createGetNodeById(nodeMap)
    )
    expect(result).toBe(1)
    expect(instance.detachInstance).toHaveBeenCalledTimes(1)
  })

  it('ネストされたインスタンスは浅い順に解体される', async () => {
    // root > outerInstance > innerInstance > target
    const root: MockNode = { id: 'root', type: 'FRAME', parent: null }
    const outerInstance: MockNode = {
      id: 'outer',
      type: 'INSTANCE',
      parent: root,
      detachInstance: jest.fn(),
    }
    const innerInstance: MockNode = {
      id: 'inner',
      type: 'INSTANCE',
      parent: outerInstance,
      detachInstance: jest.fn(),
    }
    const target: MockNode = {
      id: 'target',
      type: 'FRAME',
      parent: innerInstance,
    }

    const nodeMap = new Map<string, MockNode>([
      ['root', root],
      ['outer', outerInstance],
      ['inner', innerInstance],
      ['target', target],
    ])

    const callOrder: string[] = []
    outerInstance.detachInstance = jest.fn(() => {
      callOrder.push('outer')
    })
    innerInstance.detachInstance = jest.fn(() => {
      callOrder.push('inner')
    })

    const result = await detachAncestorInstances(
      ['target'],
      'root',
      createGetNodeById(nodeMap)
    )
    expect(result).toBe(2)
    expect(callOrder).toEqual(['outer', 'inner'])
  })

  it('rootNodeIdより上のインスタンスは無視する', async () => {
    // grandRoot(INSTANCE) > root > target
    const grandRoot: MockNode = {
      id: 'grandRoot',
      type: 'INSTANCE',
      parent: null,
      detachInstance: jest.fn(),
    }
    const root: MockNode = { id: 'root', type: 'FRAME', parent: grandRoot }
    const target: MockNode = { id: 'target', type: 'FRAME', parent: root }

    const nodeMap = new Map<string, MockNode>([
      ['grandRoot', grandRoot],
      ['root', root],
      ['target', target],
    ])

    const result = await detachAncestorInstances(
      ['target'],
      'root',
      createGetNodeById(nodeMap)
    )
    expect(result).toBe(0)
    expect(grandRoot.detachInstance).not.toHaveBeenCalled()
  })

  it('ノードが見つからない場合はスキップする', async () => {
    const nodeMap = new Map<string, MockNode>()
    const result = await detachAncestorInstances(
      ['nonexistent'],
      'root',
      createGetNodeById(nodeMap)
    )
    expect(result).toBe(0)
  })

  it('解体時にインスタンスでなくなっていた場合はスキップする', async () => {
    // root > instance > target
    // ただし解体フェーズでgetNodeByIdを呼ぶとFRAMEになっている（既に解体済み）
    const root: MockNode = { id: 'root', type: 'FRAME', parent: null }
    const instance: MockNode = {
      id: 'inst1',
      type: 'INSTANCE',
      parent: root,
      detachInstance: jest.fn(),
    }
    const target: MockNode = { id: 'target', type: 'FRAME', parent: instance }

    let callCount = 0
    const getNodeById = (id: string) => {
      if (id === 'inst1') {
        callCount++
        // 最初のcall（収集フェーズ）ではINSTANCE、解体フェーズではFRAMEを返す
        if (callCount > 1) {
          return Promise.resolve({
            ...instance,
            type: 'FRAME',
          } as MockNode)
        }
      }
      const nodeMap = new Map<string, MockNode>([
        ['root', root],
        ['inst1', instance],
        ['target', target],
      ])
      return Promise.resolve(nodeMap.get(id) ?? null)
    }

    const result = await detachAncestorInstances(
      ['target'],
      'root',
      getNodeById
    )
    expect(result).toBe(0)
    expect(instance.detachInstance).not.toHaveBeenCalled()
  })
})
