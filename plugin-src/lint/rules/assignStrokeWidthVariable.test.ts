import validate from './assignStrokeWidthVariable'
import { CUSTOM_VALUE } from '../../../shared-src/models/Rules'

describe('assignStrokeWidthVariable', () => {
  describe('SDSトークンが適用されている場合 → OK', () => {
    it('dimension/border/mediumの場合', () => {
      expect(validate('dimension/border/medium')).toBeNull()
    })

    it('dimension/border/thickの場合', () => {
      expect(validate('dimension/border/thick')).toBeNull()
    })

    it('dimension/border/extraThickの場合', () => {
      expect(validate('dimension/border/extraThick')).toBeNull()
    })
  })

  describe('SDSパターンに合致しないトークン名 → warning', () => {
    it('関係ないパスの場合', () => {
      const result = validate('spacing/medium')
      expect(result).not.toBeNull()
      expect(result?.severity).toBe('warning')
      expect(result?.message).toBe('線幅にデザイントークンを使えます')
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
      expect(result?.message).toBe('線幅にデザイントークンを使えます')
      expect(result?.messageDetails).toBe(
        '線幅にデザインシステムのバリアブルを設定してください。'
      )
    })
  })

  describe('配列入力（個別ストローク）', () => {
    it('全辺が有効なSDSトークン → OK', () => {
      const result = validate([
        'dimension/border/medium',
        'dimension/border/thick',
      ])
      expect(result).toBeNull()
    })

    it('一部がCUSTOM_VALUE → warning', () => {
      const result = validate([
        'dimension/border/medium',
        CUSTOM_VALUE,
      ])
      expect(result).not.toBeNull()
      expect(result?.severity).toBe('warning')
    })

    it('一部が不正なトークン名 → warning', () => {
      const result = validate([
        'dimension/border/medium',
        'spacing/medium',
      ])
      expect(result).not.toBeNull()
      expect(result?.severity).toBe('warning')
    })

    it('全辺がCUSTOM_VALUE → warning', () => {
      const result = validate([CUSTOM_VALUE, CUSTOM_VALUE])
      expect(result).not.toBeNull()
      expect(result?.severity).toBe('warning')
    })

    it('空配列 → OK（ストロークなし相当）', () => {
      const result = validate([])
      expect(result).toBeNull()
    })
  })
})
