import validate from './assignCornerRadiusVariable'
import { CUSTOM_VALUE } from '../../../shared-src/models/Rules'

describe('assignCornerRadiusVariable', () => {
  describe('SDSトークンが適用されている場合 → OK', () => {
    it('dimension/radius/extraSmallの場合', () => {
      expect(validate('dimension/radius/extraSmall')).toBeNull()
    })

    it('dimension/radius/smallの場合', () => {
      expect(validate('dimension/radius/small')).toBeNull()
    })

    it('dimension/radius/mediumの場合', () => {
      expect(validate('dimension/radius/medium')).toBeNull()
    })

    it('dimension/radius/largeの場合', () => {
      expect(validate('dimension/radius/large')).toBeNull()
    })

    it('dimension/radius/extraLargeの場合', () => {
      expect(validate('dimension/radius/extraLarge')).toBeNull()
    })

    it('dimension/radius/fullの場合', () => {
      expect(validate('dimension/radius/full')).toBeNull()
    })
  })

  describe('SDSパターンに合致しないトークン名 → warning', () => {
    it('関係ないパスの場合', () => {
      const result = validate('spacing/medium')
      expect(result).not.toBeNull()
      expect(result?.severity).toBe('warning')
      expect(result?.message).toBe('角丸にデザイントークンを使えます')
    })

    it('未知のトークン名の場合', () => {
      const result = validate('some/random/path')
      expect(result).not.toBeNull()
      expect(result?.severity).toBe('warning')
    })
  })

  describe('プロパティなし（null） → 許容', () => {
    it('nullの場合', () => {
      const result = validate(null)
      expect(result).toBeNull()
    })
  })

  describe('手動値（CUSTOM_VALUE） → warning', () => {
    it('CUSTOM_VALUEの場合', () => {
      const result = validate(CUSTOM_VALUE)
      expect(result).not.toBeNull()
      expect(result?.severity).toBe('warning')
      expect(result?.message).toBe('角丸にデザイントークンを使えます')
      expect(result?.messageDetails).toBe(
        '角丸にデザインシステムのバリアブルを設定してください。'
      )
    })
  })

  describe('配列入力（個別角丸）', () => {
    it('全角が有効なSDSトークン → OK', () => {
      const result = validate([
        'dimension/radius/small',
        'dimension/radius/medium',
        'dimension/radius/large',
        'dimension/radius/full',
      ])
      expect(result).toBeNull()
    })

    it('一部がCUSTOM_VALUE → warning', () => {
      const result = validate([
        'dimension/radius/small',
        CUSTOM_VALUE,
        'dimension/radius/large',
      ])
      expect(result).not.toBeNull()
      expect(result?.severity).toBe('warning')
    })

    it('一部が不正なトークン名 → warning', () => {
      const result = validate([
        'dimension/radius/small',
        'spacing/medium',
      ])
      expect(result).not.toBeNull()
      expect(result?.severity).toBe('warning')
    })

    it('全角がCUSTOM_VALUE → warning', () => {
      const result = validate([CUSTOM_VALUE, CUSTOM_VALUE])
      expect(result).not.toBeNull()
      expect(result?.severity).toBe('warning')
    })

    it('空配列 → OK（角丸なし相当）', () => {
      const result = validate([])
      expect(result).toBeNull()
    })
  })
})
