import extractStrokeWidthRole from './extractStrokeWidthRole'

describe('extractStrokeWidthRole', () => {
  describe('SDSの線幅トークン名 → ロール名を返す', () => {
    it('dimension/border/medium → medium', () => {
      expect(extractStrokeWidthRole('dimension/border/medium')).toBe('medium')
    })

    it('dimension/border/thick → thick', () => {
      expect(extractStrokeWidthRole('dimension/border/thick')).toBe('thick')
    })

    it('dimension/border/extraThick → extraThick', () => {
      expect(extractStrokeWidthRole('dimension/border/extraThick')).toBe(
        'extraThick'
      )
    })
  })

  describe('SDSに存在しないトークン名 → null', () => {
    it('borderカテゴリだが存在しないロール', () => {
      expect(extractStrokeWidthRole('dimension/border/thin')).toBeNull()
    })

    it('borderカテゴリでないパス', () => {
      expect(extractStrokeWidthRole('dimension/radius/medium')).toBeNull()
    })

    it('無関係なパス', () => {
      expect(extractStrokeWidthRole('some/random/path')).toBeNull()
    })

    it('spacingカテゴリのmedium', () => {
      expect(extractStrokeWidthRole('dimension/spacing/medium')).toBeNull()
    })
  })
})
