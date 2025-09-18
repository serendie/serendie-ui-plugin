import validate from './assignTextVariable'

describe('assignTextVariable', () => {
  describe('適切なテキスト色', () => {
    it('onから始まる場合', () => {
      const result = validate('onPrimary')
      expect(result).toBeNull()
    })

    it('Onが途中にある場合', () => {
      const result = validate('hoveredOnPrimary')
      expect(result).toBeNull()
    })
  })

  describe('不適切なテキスト色', () => {
    it('primaryの場合', () => {
      const result = validate('primary')
      expect(result).not.toBeNull()
      expect(result?.message).toBe('テキスト色が不適切')
    })

    it('primaryContainerの場合', () => {
      const result = validate('primaryContainer')
      expect(result).not.toBeNull()
      expect(result?.message).toBe('テキスト色が不適切')
    })

    it('outlineの場合', () => {
      const result = validate('outline')
      expect(result).not.toBeNull()
      expect(result?.message).toBe('テキスト色が不適切')
    })
  })

  describe('定義にないテキスト色', () => {
    it('リファレンストークンの場合', () => {
      const result = validate('sd/reference/color/scale/gray/500')
      expect(result).toBeNull()
    })

    it('任意の文字列の場合', () => {
      const result = validate('customColor')
      expect(result).not.toBeNull()
      expect(result?.message).toBe('テキスト色がバリアブル以外')
    })

    it('テキストカラーがない場合', () => {
      const result = validate(null)
      expect(result).toBeNull()
    })
  })
})
