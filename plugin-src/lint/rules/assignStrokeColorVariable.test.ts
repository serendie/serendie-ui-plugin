import validate from './assignStrokeColorVariable'
import { CUSTOM_VALUE } from '../../../shared-src/models/Rules'

describe('assignStrokeColorVariable', () => {
  describe('SDSカラーロールが適用されている場合 → OK', () => {
    it('outlineの場合', () => {
      expect(validate('color/component/outline')).toBeNull()
    })

    it('outlineVariantの場合', () => {
      expect(validate('color/component/outlineVariant')).toBeNull()
    })

    it('primaryの場合', () => {
      expect(validate('color/component/primary')).toBeNull()
    })

    it('disabledの場合', () => {
      expect(validate('color/component/disabled')).toBeNull()
    })

    it('selectedの場合', () => {
      expect(validate('color/component/selected')).toBeNull()
    })
  })

  describe('SDSカラーロールでないトークン名 → warning', () => {
    it('未知のロール名の場合', () => {
      const result = validate('color/component/unknownRole')
      expect(result).not.toBeNull()
      expect(result?.severity).toBe('warning')
      expect(result?.message).toBe('線色にデザイントークンを使えます')
    })

    it('ロールなしのパスの場合', () => {
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
      expect(result?.message).toBe('線色にデザイントークンを使えます')
      expect(result?.messageDetails).toBe(
        '線色にデザインシステムのバリアブルを設定してください。'
      )
    })
  })
})
