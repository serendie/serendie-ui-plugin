import validate from './assignFrameVariable'

describe('assignFrameVariable', () => {
  describe('適切な背景色', () => {
    it('primaryの場合', () => {
      const result = validate('primary')
      expect(result).toBeNull()
    })

    it('surfaceの場合', () => {
      const result = validate('surface')
      expect(result).toBeNull()
    })

    it('primaryContainerの場合', () => {
      const result = validate('primaryContainer')
      expect(result).toBeNull()
    })
  })

  describe('不適切な背景色', () => {
    it('onから始まる場合', () => {
      const result = validate('onPrimary')
      expect(result).not.toBeNull()
      expect(result?.message).toBe('背景色が不適切')
    })

    it('Onが途中にある場合', () => {
      const result = validate('hoveredOnPrimary')
      expect(result).not.toBeNull()
      expect(result?.message).toBe('背景色が不適切')
    })
  })

  describe('カラーロールがない背景色', () => {
    it('リファレンストークンの場合', () => {
      const result = validate('sd/reference/color/scale/gray/500')
      expect(result).toBeNull()
    })

    it('任意の文字列の場合', () => {
      const result = validate('customColor')
      expect(result).not.toBeNull()
      expect(result?.message).toBe('背景色がバリアブル以外')
    })

    it('背景色がない場合', () => {
      const result = validate(null)
      expect(result).toBeNull()
    })
  })
})
