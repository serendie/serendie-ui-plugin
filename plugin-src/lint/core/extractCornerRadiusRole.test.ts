import extractCornerRadiusRole from './extractCornerRadiusRole'

describe('extractCornerRadiusRole', () => {
  describe('SDSの角丸トークン名 → ロール名を返す', () => {
    it('dimension/radius/extraSmall → extraSmall', () => {
      expect(extractCornerRadiusRole('dimension/radius/extraSmall')).toBe(
        'extraSmall'
      )
    })

    it('dimension/radius/small → small', () => {
      expect(extractCornerRadiusRole('dimension/radius/small')).toBe('small')
    })

    it('dimension/radius/medium → medium', () => {
      expect(extractCornerRadiusRole('dimension/radius/medium')).toBe('medium')
    })

    it('dimension/radius/large → large', () => {
      expect(extractCornerRadiusRole('dimension/radius/large')).toBe('large')
    })

    it('dimension/radius/extraLarge → extraLarge', () => {
      expect(extractCornerRadiusRole('dimension/radius/extraLarge')).toBe(
        'extraLarge'
      )
    })

    it('dimension/radius/full → full', () => {
      expect(extractCornerRadiusRole('dimension/radius/full')).toBe('full')
    })
  })

  describe('SDSに存在しないトークン名 → null', () => {
    it('radiusカテゴリだが存在しないロール', () => {
      expect(extractCornerRadiusRole('dimension/radius/tiny')).toBeNull()
    })

    it('radiusカテゴリでないパス', () => {
      expect(extractCornerRadiusRole('dimension/border/medium')).toBeNull()
    })

    it('無関係なパス', () => {
      expect(extractCornerRadiusRole('some/random/path')).toBeNull()
    })

    it('spacingカテゴリのmedium', () => {
      expect(extractCornerRadiusRole('dimension/spacing/medium')).toBeNull()
    })
  })
})
