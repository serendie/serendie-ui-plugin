import { findDescendantByName } from './findDescendantByName'

// SceneNodeのモック型
type MockNode = {
  name: string
  type: string
  children?: MockNode[]
}

// SceneNodeとしてキャスト
const asSceneNode = (node: MockNode) => node as unknown as SceneNode

describe('findDescendantByName', () => {
  describe('基本的な探索', () => {
    it('直接の子ノードを見つける', () => {
      const root: MockNode = {
        name: 'Root',
        type: 'FRAME',
        children: [
          { name: 'Child1', type: 'FRAME' },
          { name: 'Child2', type: 'INSTANCE' },
        ],
      }
      const result = findDescendantByName(asSceneNode(root), 'Child2')
      expect(result).toBeDefined()
      expect((result as MockNode).name).toBe('Child2')
    })

    it('ネストした子ノードを見つける', () => {
      const root: MockNode = {
        name: 'Root',
        type: 'FRAME',
        children: [
          {
            name: 'Level1',
            type: 'FRAME',
            children: [
              {
                name: 'Level2',
                type: 'FRAME',
                children: [{ name: 'Target', type: 'INSTANCE' }],
              },
            ],
          },
        ],
      }
      const result = findDescendantByName(asSceneNode(root), 'Target')
      expect(result).toBeDefined()
      expect((result as MockNode).name).toBe('Target')
    })

    it('存在しないノードはundefinedを返す', () => {
      const root: MockNode = {
        name: 'Root',
        type: 'FRAME',
        children: [{ name: 'Child1', type: 'FRAME' }],
      }
      const result = findDescendantByName(asSceneNode(root), 'NotExist')
      expect(result).toBeUndefined()
    })

    it('子ノードがないノードはundefinedを返す', () => {
      const root: MockNode = {
        name: 'Root',
        type: 'TEXT',
      }
      const result = findDescendantByName(asSceneNode(root), 'Target')
      expect(result).toBeUndefined()
    })
  })

  describe('SerendieSymbolsフォールバック', () => {
    // SerendieSymbols系のアイコンコンポーネントは3種類（Outlined, Filled, 無印）あり、
    // 互換性があるため、AIが提案した種類と実際のデザインで使われている種類が
    // 異なっていても適用できるようにフォールバックする

    it('OutlinedSerendieSymbolsを探索してFilledSerendieSymbolsを見つける', () => {
      const root: MockNode = {
        name: 'Root',
        type: 'FRAME',
        children: [{ name: 'FilledSerendieSymbols', type: 'INSTANCE' }],
      }
      const result = findDescendantByName(
        asSceneNode(root),
        'OutlinedSerendieSymbols'
      )
      expect(result).toBeDefined()
      expect((result as MockNode).name).toBe('FilledSerendieSymbols')
    })

    it('OutlinedSerendieSymbolsを探索してSerendieSymbolsを見つける', () => {
      const root: MockNode = {
        name: 'Root',
        type: 'FRAME',
        children: [{ name: 'SerendieSymbols', type: 'INSTANCE' }],
      }
      const result = findDescendantByName(
        asSceneNode(root),
        'OutlinedSerendieSymbols'
      )
      expect(result).toBeDefined()
      expect((result as MockNode).name).toBe('SerendieSymbols')
    })

    it('FilledSerendieSymbolsを探索してOutlinedSerendieSymbolsを見つける', () => {
      const root: MockNode = {
        name: 'Root',
        type: 'FRAME',
        children: [{ name: 'OutlinedSerendieSymbols', type: 'INSTANCE' }],
      }
      const result = findDescendantByName(
        asSceneNode(root),
        'FilledSerendieSymbols'
      )
      expect(result).toBeDefined()
      expect((result as MockNode).name).toBe('OutlinedSerendieSymbols')
    })

    it('SerendieSymbolsを探索してOutlinedSerendieSymbolsを見つける', () => {
      const root: MockNode = {
        name: 'Root',
        type: 'FRAME',
        children: [{ name: 'OutlinedSerendieSymbols', type: 'INSTANCE' }],
      }
      const result = findDescendantByName(asSceneNode(root), 'SerendieSymbols')
      expect(result).toBeDefined()
      expect((result as MockNode).name).toBe('OutlinedSerendieSymbols')
    })

    it('完全一致が優先される', () => {
      // 完全一致が先にある場合
      const root: MockNode = {
        name: 'Root',
        type: 'FRAME',
        children: [
          { name: 'OutlinedSerendieSymbols', type: 'INSTANCE' },
          { name: 'FilledSerendieSymbols', type: 'INSTANCE' },
        ],
      }
      const result = findDescendantByName(
        asSceneNode(root),
        'OutlinedSerendieSymbols'
      )
      expect(result).toBeDefined()
      expect((result as MockNode).name).toBe('OutlinedSerendieSymbols')
    })

    it('フォールバックは子の順序に従う', () => {
      // フォールバック候補が先にある場合、それが返る
      const root: MockNode = {
        name: 'Root',
        type: 'FRAME',
        children: [
          { name: 'FilledSerendieSymbols', type: 'INSTANCE' },
          { name: 'OutlinedSerendieSymbols', type: 'INSTANCE' },
        ],
      }
      const result = findDescendantByName(
        asSceneNode(root),
        'OutlinedSerendieSymbols'
      )
      expect(result).toBeDefined()
      // namesToSearchに両方含まれるため、配列順で最初に見つかったFilledが返る
      expect((result as MockNode).name).toBe('FilledSerendieSymbols')
    })
  })

  describe('深くネストした構造の探索', () => {
    // Figmaのコンポーネントは内部に意味のないフレーム（Auto Layout用など）が
    // 挟まっていることが多いため、再帰的に探索する必要がある

    it('中間に無関係なフレームがあっても目的のノードを見つける', () => {
      const root: MockNode = {
        name: 'Root',
        type: 'INSTANCE',
        children: [
          {
            name: 'Container',
            type: 'FRAME',
            children: [
              {
                name: 'Wrapper',
                type: 'FRAME',
                children: [
                  {
                    name: 'Target',
                    type: 'FRAME',
                    children: [{ name: 'Icon', type: 'INSTANCE' }],
                  },
                ],
              },
            ],
          },
        ],
      }
      const result = findDescendantByName(asSceneNode(root), 'Target')
      expect(result).toBeDefined()
      expect((result as MockNode).name).toBe('Target')
    })

    it('見つけたノードの子を続けて探索できる', () => {
      const parent: MockNode = {
        name: 'Parent',
        type: 'FRAME',
        children: [{ name: 'Child', type: 'INSTANCE' }],
      }
      const result = findDescendantByName(asSceneNode(parent), 'Child')
      expect(result).toBeDefined()
      expect((result as MockNode).name).toBe('Child')
    })
  })

  describe('エッジケース', () => {
    it('空の子ノード配列', () => {
      const root: MockNode = {
        name: 'Root',
        type: 'FRAME',
        children: [],
      }
      const result = findDescendantByName(asSceneNode(root), 'Target')
      expect(result).toBeUndefined()
    })

    it('同名ノードが複数ある場合、深さ優先で最初に見つかったものを返す', () => {
      const root: MockNode = {
        name: 'Root',
        type: 'FRAME',
        children: [
          {
            name: 'Branch1',
            type: 'FRAME',
            children: [{ name: 'Target', type: 'INSTANCE' }],
          },
          { name: 'Target', type: 'INSTANCE' },
        ],
      }
      const result = findDescendantByName(asSceneNode(root), 'Target')
      expect(result).toBeDefined()
      // Branch1を先にチェック → その子のTargetを見つけて返す
      // （Root直下のTargetは探索されない）
    })

    it('フォールバック対象外のコンポーネントはフォールバックしない', () => {
      const root: MockNode = {
        name: 'Root',
        type: 'FRAME',
        children: [{ name: 'Button', type: 'INSTANCE' }],
      }
      const result = findDescendantByName(asSceneNode(root), 'TextField')
      expect(result).toBeUndefined()
    })
  })
})
