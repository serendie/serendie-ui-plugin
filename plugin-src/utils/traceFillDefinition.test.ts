import traceFillDefinition from './traceFillDefinition'
import { VariableMap } from './getVariableMap'
import extractVariableKey from '../core/extractVariableKey'
import { UNEXPECTED } from '../../shared-src/models/Rules'

jest.mock('../core/extractVariableKey')
const mockExtractVariableKey = extractVariableKey as jest.MockedFunction<
  typeof extractVariableKey
>

describe('traceFillDefinition', () => {
  let variableMap: VariableMap

  beforeEach(() => {
    mockExtractVariableKey.mockImplementation((id: string) => id)

    variableMap = new Map([
      ['variable123', 'primary'],
      ['variable456', 'secondary'],
      ['variable789', 'surface'],
    ])
  })

  describe('ノード自身の背景色を取得', () => {
    it('塗りつぶしの変数がマッピングされている場合', () => {
      const node: Partial<FrameNode> = {
        type: 'FRAME',
        fills: [
          {
            type: 'SOLID',
            visible: true,
            boundVariables: {
              color: { id: 'variable123' },
            },
          } as SolidPaint,
        ],
        parent: null,
      }
      const result = traceFillDefinition(node as FrameNode, variableMap)
      expect(result).toBe('primary')
    })

    it('塗りつぶしの変数がマッピングに存在しない場合', () => {
      const node: Partial<FrameNode> = {
        type: 'FRAME',
        fills: [
          {
            type: 'SOLID',
            visible: true,
            boundVariables: {
              color: { id: 'unknown999' },
            },
          } as SolidPaint,
        ],
        parent: null,
      }
      const result = traceFillDefinition(node as FrameNode, variableMap)
      expect(result).toBe(UNEXPECTED)
    })

    it('塗りつぶしが非表示の場合', () => {
      const node: Partial<FrameNode> = {
        type: 'FRAME',
        fills: [
          {
            type: 'SOLID',
            visible: false,
            boundVariables: {
              color: { id: 'variable123' },
            },
          } as SolidPaint,
        ],
        parent: null,
      }
      const result = traceFillDefinition(node as FrameNode, variableMap)
      expect(result).toBeNull()
    })

    it('塗りつぶしがSOLID以外の場合', () => {
      const node: Partial<FrameNode> = {
        type: 'FRAME',
        fills: [
          {
            type: 'GRADIENT_LINEAR',
            visible: true,
            gradientTransform: [
              [1, 0, 0],
              [0, 1, 0],
            ] as Transform,
            gradientStops: [],
            boundVariables: {
              color: { id: 'variable123' },
            },
          } as GradientPaint,
        ],
        parent: null,
      }
      const result = traceFillDefinition(node as FrameNode, variableMap)
      expect(result).toBe(UNEXPECTED)
    })

    it('塗りつぶしに変数がバインドされていない場合', () => {
      const node: Partial<FrameNode> = {
        type: 'FRAME',
        fills: [
          {
            type: 'SOLID',
            visible: true,
          } as SolidPaint,
        ],
        parent: null,
      }
      const result = traceFillDefinition(node as FrameNode, variableMap)
      expect(result).toBe(UNEXPECTED)
    })

    it('塗りつぶしが空配列の場合', () => {
      const node: Partial<FrameNode> = {
        type: 'FRAME',
        fills: [],
        parent: null,
      }
      const result = traceFillDefinition(node as FrameNode, variableMap)
      expect(result).toBeNull()
    })

    it('塗りつぶしプロパティが存在しない場合', () => {
      const node: Partial<FrameNode> = {
        type: 'FRAME',
        parent: null,
      }

      const result = traceFillDefinition(node as FrameNode, variableMap)
      expect(result).toBeNull()
    })
  })

  describe('親ノードから背景色を継承', () => {
    it('親ノードに背景色がある場合', () => {
      const parentNode: Partial<FrameNode> = {
        type: 'FRAME',
        fills: [
          {
            type: 'SOLID',
            visible: true,
            boundVariables: {
              color: { id: 'variable789' },
            },
          } as SolidPaint,
        ],
        parent: { type: 'PAGE' } as PageNode,
      }

      const node: Partial<FrameNode> = {
        type: 'FRAME',
        fills: [],
        parent: parentNode as FrameNode,
      }

      const result = traceFillDefinition(node as FrameNode, variableMap)
      expect(result).toBe('surface')
    })

    it('複数階層の親を辿って背景色を取得', () => {
      const grandparentNode: Partial<FrameNode> = {
        type: 'FRAME',
        fills: [
          {
            type: 'SOLID',
            visible: true,
            boundVariables: {
              color: { id: 'variable456' },
            },
          } as SolidPaint,
        ],
        parent: { type: 'PAGE' } as PageNode,
      }

      const parentNode: Partial<FrameNode> = {
        type: 'FRAME',
        fills: [],
        parent: grandparentNode as FrameNode,
      }

      const node: Partial<FrameNode> = {
        type: 'FRAME',
        fills: [],
        parent: parentNode as FrameNode,
      }

      const result = traceFillDefinition(node as FrameNode, variableMap)
      expect(result).toBe('secondary')
    })

    it('親ノードがPAGEの場合は探索を停止', () => {
      const node: Partial<FrameNode> = {
        type: 'FRAME',
        fills: [],
        parent: { type: 'PAGE' } as PageNode,
      }

      const result = traceFillDefinition(node as FrameNode, variableMap)
      expect(result).toBeNull()
    })

    it('親ノードがDOCUMENTの場合は探索を停止', () => {
      const node: Partial<Omit<FrameNode, 'parent'>> & {
        parent: Partial<DocumentNode>
      } = {
        type: 'FRAME',
        fills: [],
        parent: { type: 'DOCUMENT' } as Partial<DocumentNode>,
      }

      const result = traceFillDefinition(node as FrameNode, variableMap)
      expect(result).toBeNull()
    })

    it('親ノードが存在しない場合', () => {
      const node: Partial<FrameNode> = {
        type: 'FRAME',
        fills: [],
        parent: null,
      }

      const result = traceFillDefinition(node as FrameNode, variableMap)
      expect(result).toBeNull()
    })
  })

  describe('優先順位のテスト', () => {
    it('ノード自身に背景色がある場合は親よりも優先される', () => {
      const parentNode: Partial<FrameNode> = {
        type: 'FRAME',
        fills: [
          {
            type: 'SOLID',
            visible: true,
            boundVariables: {
              color: { id: 'variable789' },
            },
          } as SolidPaint,
        ],
        parent: { type: 'PAGE' } as PageNode,
      }

      const node: Partial<FrameNode> = {
        type: 'FRAME',
        fills: [
          {
            type: 'SOLID',
            visible: true,
            boundVariables: {
              color: { id: 'variable123' },
            },
          } as SolidPaint,
        ],
        parent: parentNode as FrameNode,
      }

      const result = traceFillDefinition(node as FrameNode, variableMap)
      expect(result).toBe('primary')
    })

    it('複数の塗りつぶしがある場合は最初のものを使用', () => {
      const node: Partial<FrameNode> = {
        type: 'FRAME',
        fills: [
          {
            type: 'SOLID',
            visible: true,
            boundVariables: {
              color: { id: 'variable123' },
            },
          } as SolidPaint,
          {
            type: 'SOLID',
            visible: true,
            boundVariables: {
              color: { id: 'variable456' },
            },
          } as SolidPaint,
        ],
        parent: null,
      }

      const result = traceFillDefinition(node as FrameNode, variableMap)
      expect(result).toBe('primary')
    })

    it('複数の塗りつぶしがあり非表示の要素がある場合', () => {
      const node: Partial<FrameNode> = {
        type: 'FRAME',
        fills: [
          {
            type: 'SOLID',
            visible: false, // 最初の要素が非表示
            boundVariables: {
              color: { id: 'variable123' },
            },
          } as SolidPaint,
          {
            type: 'SOLID',
            visible: true, // 2番目の要素が表示
            boundVariables: {
              color: { id: 'variable456' },
            },
          } as SolidPaint,
          {
            type: 'SOLID',
            visible: false, // 3番目の要素も非表示
            boundVariables: {
              color: { id: 'variable789' },
            },
          } as SolidPaint,
        ],
        parent: null,
      }

      // 最初の要素が非表示なので、nullが返されるはず（現在の実装では最初の要素のみチェック）
      const result = traceFillDefinition(node as FrameNode, variableMap)
      expect(result).toBeNull()
    })

    it('複数の塗りつぶしがあり全て非表示の場合', () => {
      const node: Partial<FrameNode> = {
        type: 'FRAME',
        fills: [
          {
            type: 'SOLID',
            visible: false,
            boundVariables: {
              color: { id: 'variable123' },
            },
          } as SolidPaint,
          {
            type: 'SOLID',
            visible: false,
            boundVariables: {
              color: { id: 'variable456' },
            },
          } as SolidPaint,
        ],
        parent: null,
      }

      const result = traceFillDefinition(node as FrameNode, variableMap)
      expect(result).toBeNull()
    })
  })
})
