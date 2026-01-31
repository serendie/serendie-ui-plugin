import { filterValidCandidates } from '../models/componentValidationSchema'

const validCandidate = {
  nodeId: '1600:6545',
  suggestedComponent: 'TopAppBar',
  properties: { Title: 'アプリ名', ShowHeadingIcon: false },
  confidence: 'medium' as const,
  reason: 'テスト用の理由',
}

describe('filterValidCandidates', () => {
  it('正常なオブジェクト配列はそのまま返す', () => {
    const result = filterValidCandidates([validCandidate])
    expect(result).toEqual([validCandidate])
  })

  it('文字列が混入した配列からオブジェクトのみ返す', () => {
    const input = [
      validCandidate,
      'nodeId',
      'suggestedComponent',
      'properties',
      'confidence',
      'reason',
    ]
    const result = filterValidCandidates(input)
    expect(result).toEqual([validCandidate])
  })

  it('空配列は空配列を返す', () => {
    expect(filterValidCandidates([])).toEqual([])
  })

  it('文字列のみの配列は空配列を返す', () => {
    const result = filterValidCandidates([
      'nodeId',
      'suggestedComponent',
      'reason',
    ])
    expect(result).toEqual([])
  })

  it('必須フィールド欠損のオブジェクトは除外する', () => {
    const incomplete = { nodeId: '1:2', suggestedComponent: 'Button' }
    const result = filterValidCandidates([validCandidate, incomplete])
    expect(result).toEqual([validCandidate])
  })
})
