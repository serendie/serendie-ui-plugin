import extractColorRole from './extractColorRole'

describe('extractColorRole', () => {
  describe('正常系', () => {
    it('ロール名はそのまま返す', () => {
      expect(extractColorRole('primary')).toBe('primary')
      expect(extractColorRole('onPrimary')).toBe('onPrimary')
    })

    it('パスから抽出する', () => {
      expect(extractColorRole('theme/light/system/color/primary')).toBe(
        'primary'
      )
      expect(extractColorRole('a/b/c/d/e/f/onPrimary')).toBe('onPrimary')
    })
  })

  describe('異常系', () => {
    it('COLOR_ROLES以外はnullを返す', () => {
      expect(extractColorRole('color/invalid')).toBeNull()
      expect(extractColorRole('color/unknownRole')).toBeNull()
      expect(extractColorRole('primary/color')).toBeNull()
      expect(extractColorRole('notAColorRole')).toBeNull()
    })

    it('空文字列の場合はnullを返す', () => {
      expect(extractColorRole('')).toBeNull()
    })

    it('スラッシュのみの場合はnullを返す', () => {
      expect(extractColorRole('/')).toBeNull()
      expect(extractColorRole('//')).toBeNull()
      expect(extractColorRole('///')).toBeNull()
    })

    it('末尾にスラッシュがある場合はnullを返す', () => {
      expect(extractColorRole('color/primary/')).toBeNull()
      expect(extractColorRole('color/onPrimary/')).toBeNull()
    })

    it('部分一致ではなく完全一致で判定する', () => {
      expect(extractColorRole('color/primaryColor')).toBeNull()
      expect(extractColorRole('color/onPrimaryColor')).toBeNull()
      expect(extractColorRole('color/primaryContainerExtra')).toBeNull()
    })
  })
})
