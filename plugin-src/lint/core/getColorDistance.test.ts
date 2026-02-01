import { getColorDistance } from './getColorDistance'

describe('getColorDistance', () => {
  it('同一色は距離0', () => {
    expect(getColorDistance({ r: 1, g: 0, b: 0 }, { r: 1, g: 0, b: 0 })).toBe(0)
  })

  it('黒と白の距離', () => {
    expect(getColorDistance({ r: 0, g: 0, b: 0 }, { r: 1, g: 1, b: 1 })).toBe(3)
  })

  it('R成分のみの差', () => {
    expect(
      getColorDistance({ r: 0.5, g: 0, b: 0 }, { r: 1, g: 0, b: 0 })
    ).toBeCloseTo(0.25)
  })

  it('近い色と遠い色の比較', () => {
    const base = { r: 0.5, g: 0.5, b: 0.5 }
    const near = { r: 0.6, g: 0.5, b: 0.5 }
    const far = { r: 1, g: 0, b: 0 }
    expect(getColorDistance(base, near)).toBeLessThan(getColorDistance(base, far))
  })

  it('順序に依存しない（対称性）', () => {
    const a = { r: 0.2, g: 0.4, b: 0.6 }
    const b = { r: 0.8, g: 0.1, b: 0.3 }
    expect(getColorDistance(a, b)).toBe(getColorDistance(b, a))
  })
})
