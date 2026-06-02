import getToolDescription from './getToolDescription'

describe('getToolDescription', () => {
  it('Material Design 3の参考資料検索は略称を使わず説明する', () => {
    expect(getToolDescription('search-md3-design-token-docs')).toBe(
      'Material Design 3由来のトークン設計参考資料を検索しました'
    )
  })
})
