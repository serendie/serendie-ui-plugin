import validate from './colorPairing'
import { UNEXPECTED } from '../../shared-src/models/Rules'

describe('colorPairing', () => {
  describe('正常なカラーペアリング', () => {
    it('基本の組み合わせ', () => {
      const result = validate('onPrimary', 'primary')
      expect(result).toBeNull()
    })

    it('基本の組み合わせ（逆順）', () => {
      const result = validate('primary', 'onPrimary')
      expect(result).toBeNull()
    })

    it('Variantの組み合わせ', () => {
      const result = validate('onSurfaceVariant', 'surface')
      expect(result).toBeNull()
    })

    it('Variantの組み合わせ（逆順）', () => {
      const result = validate('surface', 'onSurfaceVariant')
      expect(result).toBeNull()
    })

    it('明度違いの組み合わせ', () => {
      const result = validate('onSurface', 'surfaceContainerLowest')
      expect(result).toBeNull()
    })

    it('明度違いとVariantの組み合わせ', () => {
      const result = validate('onSurfaceVariant', 'surfaceContainerHigh')
      expect(result).toBeNull()
    })
  })

  describe('不適切なカラーペアリング', () => {
    it('同色組み合わせ', () => {
      const result = validate('primary', 'primary')
      expect(result).not.toBeNull()
      expect(result?.severity).toBe('error')
      expect(result?.message).toBe('テキスト色または背景色が不適切')
    })

    it('同色組み合わせ（on系）', () => {
      const result = validate('onPrimary', 'onPrimary')
      expect(result).not.toBeNull()
      expect(result?.message).toBe('テキスト色または背景色が不適切')
    })

    it('異なるロールの組み合わせ', () => {
      const result = validate('primary', 'secondary')
      expect(result).not.toBeNull()
      expect(result?.message).toBe('テキスト色または背景色が不適切')
    })

    it('異なるロールの組み合わせ（on系）', () => {
      const result = validate('onPrimary', 'onSecondary')
      expect(result).not.toBeNull()
      expect(result?.message).toBe('テキスト色または背景色が不適切')
    })

    it('不適切な組み合わせ', () => {
      const result = validate('surface', 'primary')
      expect(result).not.toBeNull()
      expect(result?.message).toBe('テキスト色または背景色が不適切')
    })
  })

  describe('無効な入力の処理', () => {
    it('textColorがnullの場合', () => {
      const result = validate(null, 'primary')
      expect(result).toBeNull()
    })

    it('backgroundColorがnullの場合', () => {
      const result = validate('onPrimary', null)
      expect(result).toBeNull()
    })

    it('両方がnullの場合', () => {
      const result = validate(null, null)
      expect(result).toBeNull()
    })

    it('textColorがUNEXPECTEDの場合', () => {
      const result = validate(UNEXPECTED, 'primary')
      expect(result).toBeNull()
    })

    it('backgroundColorがUNEXPECTEDの場合', () => {
      const result = validate('onPrimary', UNEXPECTED)
      expect(result).toBeNull()
    })

    it('両方がUNEXPECTEDの場合', () => {
      const result = validate(UNEXPECTED, UNEXPECTED)
      expect(result).toBeNull()
    })
  })

  describe('認識できないカラーロール', () => {
    it('textColorが認識できないロールの場合', () => {
      const result = validate('unknownColor', 'primary')
      expect(result).toBeNull()
    })

    it('backgroundColorが認識できないロールの場合', () => {
      const result = validate('onPrimary', 'unknownColor')
      expect(result).toBeNull()
    })

    it('両方が認識できないロールの場合', () => {
      const result = validate('unknownColor1', 'unknownColor2')
      expect(result).toBeNull()
    })
  })
})
