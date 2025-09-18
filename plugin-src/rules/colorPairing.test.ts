import validate from './colorPairing'

describe('colorPairing', () => {
  describe('正常なカラーペアリング', () => {
    it('1対1対応', () => {
      const result = validate('onError', 'error')
      expect(result).toBeNull()
    })

    it('1対1対応（逆順）', () => {
      const result = validate('error', 'onError')
      expect(result).toBeNull()
    })

    it('多対多対応', () => {
      const result = validate('onSurface', 'surfaceContainerLowest')
      expect(result).toBeNull()
    })

    it('多対多対応（逆順）', () => {
      const result = validate('surfaceContainerLowest', 'onSurface')
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

    it('異なるロールの組み合わせ', () => {
      const result = validate('primary', 'secondary')
      expect(result).not.toBeNull()
      expect(result?.message).toBe('テキスト色または背景色が不適切')
    })
  })

  describe('無効な入力の処理', () => {
    it('テキスト色がない場合', () => {
      const result = validate(null, 'primary')
      expect(result).toBeNull()
    })

    it('背景色がない場合', () => {
      const result = validate('onPrimary', null)
      expect(result).toBeNull()
    })

    it('テキスト色も背景色もない場合', () => {
      const result = validate(null, null)
      expect(result).toBeNull()
    })
  })

  describe('認識できないカラーロール', () => {
    it('テキスト色が認識できないロールの場合', () => {
      const result = validate('unknownColor', 'primary')
      expect(result).toBeNull()
    })

    it('背景色が認識できないロールの場合', () => {
      const result = validate('onPrimary', 'unknownColor')
      expect(result).toBeNull()
    })

    it('テキスト色も背景色も認識できないロールの場合', () => {
      const result = validate('unknownColor1', 'unknownColor2')
      expect(result).toBeNull()
    })
  })
})
