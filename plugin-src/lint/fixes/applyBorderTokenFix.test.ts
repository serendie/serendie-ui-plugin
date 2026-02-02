import { findClosestCandidate, shouldUseFull } from './applyBorderTokenFix'

describe('findClosestCandidate', () => {
  const makeCandidates = (values: { name: string; value: number }[]) =>
    values.map((v) => ({
      variable: {} as Variable,
      name: v.name,
      value: v.value,
    }))

  it('最も近い値の候補を返す', () => {
    const candidates = makeCandidates([
      { name: 'medium', value: 1 },
      { name: 'thick', value: 2 },
      { name: 'extraThick', value: 4 },
    ])
    const result = findClosestCandidate(1.5, candidates)
    expect(result?.name).toBe('medium')
  })

  it('完全一致する候補がある場合はそれを返す', () => {
    const candidates = makeCandidates([
      { name: 'medium', value: 1 },
      { name: 'thick', value: 2 },
      { name: 'extraThick', value: 4 },
    ])
    const result = findClosestCandidate(2, candidates)
    expect(result?.name).toBe('thick')
  })

  it('中間値で近い方を返す (3はthickの方が近い)', () => {
    const candidates = makeCandidates([
      { name: 'medium', value: 1 },
      { name: 'thick', value: 2 },
      { name: 'extraThick', value: 4 },
    ])
    const result = findClosestCandidate(3, candidates)
    expect(result?.name).toBe('thick')
  })

  it('大きな値はextraThickを返す', () => {
    const candidates = makeCandidates([
      { name: 'medium', value: 1 },
      { name: 'thick', value: 2 },
      { name: 'extraThick', value: 4 },
    ])
    const result = findClosestCandidate(10, candidates)
    expect(result?.name).toBe('extraThick')
  })

  it('空配列はnullを返す', () => {
    expect(findClosestCandidate(1, [])).toBeNull()
  })

  it('候補が1つの場合はそれを返す', () => {
    const candidates = makeCandidates([{ name: 'only', value: 8 }])
    const result = findClosestCandidate(100, candidates)
    expect(result?.name).toBe('only')
  })

  it('角丸トークンの近似マッチング', () => {
    const candidates = makeCandidates([
      { name: 'extraSmall', value: 2 },
      { name: 'small', value: 4 },
      { name: 'medium', value: 8 },
      { name: 'large', value: 12 },
      { name: 'extraLarge', value: 16 },
    ])
    expect(findClosestCandidate(3, candidates)?.name).toBe('extraSmall')
    expect(findClosestCandidate(6, candidates)?.name).toBe('small')
    expect(findClosestCandidate(10, candidates)?.name).toBe('medium')
    expect(findClosestCandidate(14, candidates)?.name).toBe('large')
    expect(findClosestCandidate(20, candidates)?.name).toBe('extraLarge')
  })
})

describe('shouldUseFull', () => {
  it('角丸が高さの半分以上ならtrue', () => {
    expect(shouldUseFull(20, 40)).toBe(true)
  })

  it('角丸が高さの半分未満ならfalse', () => {
    expect(shouldUseFull(19, 40)).toBe(false)
  })

  it('角丸が高さの半分と等しい場合はtrue', () => {
    expect(shouldUseFull(50, 100)).toBe(true)
  })

  it('角丸が高さより大きい場合もtrue', () => {
    expect(shouldUseFull(100, 40)).toBe(true)
  })

  it('高さが0の場合はfalse', () => {
    expect(shouldUseFull(10, 0)).toBe(false)
  })

  it('角丸が0の場合はfalse', () => {
    expect(shouldUseFull(0, 40)).toBe(false)
  })

  it('ピル型ボタン (height=40, radius=20)', () => {
    expect(shouldUseFull(20, 40)).toBe(true)
  })

  it('少し丸い角 (height=40, radius=8)', () => {
    expect(shouldUseFull(8, 40)).toBe(false)
  })
})
