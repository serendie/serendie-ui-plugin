import validate from './assignCornerRadiusVariable'

describe('assignCornerRadiusVariable', () => {
  describe('トークンが適用されている場合', () => {
    it('dimension/radius/mediumの場合', () => {
      const result = validate('dimension/radius/medium')
      expect(result).toBeNull()
    })

    it('dimension/radius/extraSmallの場合', () => {
      const result = validate('dimension/radius/extraSmall')
      expect(result).toBeNull()
    })

    it('dimension/radius/fullの場合', () => {
      const result = validate('dimension/radius/full')
      expect(result).toBeNull()
    })
  })

  describe('トークンが適用されていない場合', () => {
    it('Unexpectedの場合 → warning', () => {
      const result = validate('Unexpected')
      expect(result).not.toBeNull()
      expect(result?.severity).toBe('warning')
      expect(result?.message).toBe('角丸にデザイントークンを使えます')
      expect(result?.messageDetails).toBe(
        '角丸にデザインシステムのバリアブルを設定してください。'
      )
    })
  })

  describe('角丸がない場合', () => {
    it('nullの場合', () => {
      const result = validate(null)
      expect(result).toBeNull()
    })
  })
})
