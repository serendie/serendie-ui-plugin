import validate from './assignStrokeWidthVariable'

describe('assignStrokeWidthVariable', () => {
  describe('トークンが適用されている場合', () => {
    it('dimension/border/mediumの場合', () => {
      const result = validate('dimension/border/medium')
      expect(result).toBeNull()
    })

    it('dimension/border/thickの場合', () => {
      const result = validate('dimension/border/thick')
      expect(result).toBeNull()
    })

    it('dimension/border/extraThickの場合', () => {
      const result = validate('dimension/border/extraThick')
      expect(result).toBeNull()
    })
  })

  describe('トークンが適用されていない場合', () => {
    it('Unexpectedの場合 → warning', () => {
      const result = validate('Unexpected')
      expect(result).not.toBeNull()
      expect(result?.severity).toBe('warning')
      expect(result?.message).toBe('線幅にデザイントークンを使えます')
      expect(result?.messageDetails).toBe(
        '線幅にデザインシステムのバリアブルを設定してください。'
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
