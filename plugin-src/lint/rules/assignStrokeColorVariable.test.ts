import validate from './assignStrokeColorVariable'

describe('assignStrokeColorVariable', () => {
  describe('トークンが適用されている場合', () => {
    it('outlineの場合', () => {
      const result = validate('outline')
      expect(result).toBeNull()
    })

    it('outlineVariantの場合', () => {
      const result = validate('outlineVariant')
      expect(result).toBeNull()
    })

    it('primaryの場合', () => {
      const result = validate('primary')
      expect(result).toBeNull()
    })
  })

  describe('トークンが適用されていない場合', () => {
    it('Unexpectedの場合 → warning', () => {
      const result = validate('Unexpected')
      expect(result).not.toBeNull()
      expect(result?.severity).toBe('warning')
      expect(result?.message).toBe('線色にデザイントークンを使えます')
      expect(result?.messageDetails).toBe(
        '線色にデザインシステムのバリアブルを設定してください。'
      )
    })
  })

  describe('ストロークがない場合', () => {
    it('nullの場合', () => {
      const result = validate(null)
      expect(result).toBeNull()
    })
  })
})
