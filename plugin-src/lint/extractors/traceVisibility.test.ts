import traceVisibility from './traceVisibility'

describe('traceVisibility', () => {
  describe('自身で判定', () => {
    it('非表示のノードの場合', () => {
      const node: Partial<FrameNode> = {
        type: 'FRAME',
        visible: false,
        parent: null,
      }

      const result = traceVisibility(node as FrameNode)
      expect(result).toBe(false)
    })
  })

  describe('親を遡って判定', () => {
    it('親が非表示の場合', () => {
      const parentNode: Partial<FrameNode> = {
        type: 'FRAME',
        visible: false,
        parent: { type: 'PAGE' } as PageNode,
      }

      const node: Partial<FrameNode> = {
        type: 'FRAME',
        visible: true,
        parent: parentNode as FrameNode,
      }

      const result = traceVisibility(node as FrameNode)
      expect(result).toBe(false) // 親が非表示なのでfalse
    })

    it('親の親が非表示', () => {
      const grandparentNode: Partial<FrameNode> = {
        type: 'FRAME',
        visible: false,
        parent: { type: 'PAGE' } as PageNode,
      }

      const parentNode: Partial<FrameNode> = {
        type: 'FRAME',
        visible: true,
        parent: grandparentNode as FrameNode,
      }

      const node: Partial<FrameNode> = {
        type: 'FRAME',
        visible: true,
        parent: parentNode as FrameNode,
      }

      const result = traceVisibility(node as FrameNode)
      expect(result).toBe(false) // 祖父が非表示なのでfalse
    })

    it('すべての親が表示されている場合', () => {
      const grandparentNode: Partial<FrameNode> = {
        type: 'FRAME',
        visible: true,
        parent: { type: 'PAGE' } as PageNode,
      }

      const parentNode: Partial<FrameNode> = {
        type: 'FRAME',
        visible: true,
        parent: grandparentNode as FrameNode,
      }

      const node: Partial<FrameNode> = {
        type: 'FRAME',
        visible: true,
        parent: parentNode as FrameNode,
      }

      const result = traceVisibility(node as FrameNode)
      expect(result).toBe(true)
    })
  })

  describe('探索の終了', () => {
    it('親ノードがPAGEの場合', () => {
      const node: Partial<FrameNode> = {
        type: 'FRAME',
        visible: true,
        parent: { type: 'PAGE' } as PageNode,
      }

      const result = traceVisibility(node as FrameNode)
      expect(result).toBe(true)
    })

    it('親ノードがDOCUMENTの場合', () => {
      const node: Partial<Omit<FrameNode, 'parent'>> & {
        parent: Partial<DocumentNode>
      } = {
        type: 'FRAME',
        visible: true,
        parent: { type: 'DOCUMENT' },
      }

      const result = traceVisibility(node as unknown as FrameNode)
      expect(result).toBe(true)
    })

    it('親ノードがnullの場合', () => {
      const node: Partial<FrameNode> = {
        type: 'FRAME',
        visible: true,
        parent: null,
      }

      const result = traceVisibility(node as FrameNode)
      expect(result).toBe(true)
    })
  })

  describe('複合的なケース', () => {
    it('自身が非表示かつ親も非表示の場合', () => {
      const parentNode: Partial<FrameNode> = {
        type: 'FRAME',
        visible: false,
        parent: { type: 'PAGE' } as PageNode,
      }

      const node: Partial<FrameNode> = {
        type: 'FRAME',
        visible: false,
        parent: parentNode as FrameNode,
      }

      const result = traceVisibility(node as FrameNode)
      expect(result).toBe(false)
    })

    it('visibleプロパティが混在する場合', () => {
      const grandparentNode: Partial<FrameNode> = {
        type: 'FRAME',
        // visible未定義
        parent: { type: 'PAGE' } as PageNode,
      }

      const parentNode: Partial<FrameNode> = {
        type: 'FRAME',
        visible: true,
        parent: grandparentNode as FrameNode,
      }

      const node: Partial<FrameNode> = {
        type: 'FRAME',
        // visible未定義
        parent: parentNode as FrameNode,
      }

      const result = traceVisibility(node as FrameNode)
      expect(result).toBe(true)
    })
  })
})
