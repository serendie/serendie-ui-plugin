import {
  pickBestCandidate,
  CONTAINER_SIZE_THRESHOLD,
} from './pickBestColorVariable'

describe('pickBestCandidate', () => {
  it('距離が最も近い候補を選ぶ', () => {
    const result = pickBestCandidate(
      [
        { role: 'surface', distance: 0.5 },
        { role: 'primary', distance: 0.1 },
        { role: 'secondary', distance: 0.3 },
      ],
      0
    )
    expect(result?.role).toBe('primary')
  })

  it('同距離で大面積ノードはContainerを優先', () => {
    const result = pickBestCandidate(
      [
        { role: 'surface', distance: 0.1 },
        { role: 'surfaceContainer', distance: 0.1 },
      ],
      CONTAINER_SIZE_THRESHOLD
    )
    expect(result?.role).toBe('surfaceContainer')
  })

  it('同距離で小面積ノードは無印を優先', () => {
    const result = pickBestCandidate(
      [
        { role: 'surfaceContainer', distance: 0.1 },
        { role: 'surface', distance: 0.1 },
      ],
      CONTAINER_SIZE_THRESHOLD - 1
    )
    expect(result?.role).toBe('surface')
  })

  it('同距離で両方Containerなら先の候補を維持', () => {
    const result = pickBestCandidate(
      [
        { role: 'surfaceContainer', distance: 0.1 },
        { role: 'primaryContainer', distance: 0.1 },
      ],
      CONTAINER_SIZE_THRESHOLD
    )
    expect(result?.role).toBe('surfaceContainer')
  })

  it('同距離で両方無印なら先の候補を維持', () => {
    const result = pickBestCandidate(
      [
        { role: 'surface', distance: 0.1 },
        { role: 'primary', distance: 0.1 },
      ],
      0
    )
    expect(result?.role).toBe('surface')
  })

  it('空配列はnullを返す', () => {
    expect(pickBestCandidate([], 0)).toBeNull()
  })

  it('候補が1つの場合はそれを返す', () => {
    const result = pickBestCandidate(
      [{ role: 'onSurface', distance: 0.5 }],
      0
    )
    expect(result?.role).toBe('onSurface')
  })
})
