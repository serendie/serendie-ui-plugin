import validate from './colorPairing'
import {
  TEXT_COLOR_PAIRS,
  BACKGROUND_COLOR_PAIRS,
} from '../../../shared-src/models/Rules'

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

    it('背景色からsuggestionが付く', () => {
      const result = validate('onSecondary', 'primary')
      expect(result?.suggestion).toEqual({
        targetRoles: ['onPrimary'],
        targetProperty: 'textColor',
      })
    })

    it('背景色が配列候補の場合は全候補を提案', () => {
      const result = validate('onPrimary', 'surface')
      expect(result?.suggestion?.targetRoles).toContain('onSurface')
      expect(result?.suggestion?.targetRoles).toContain('onSurfaceVariant')
      expect(result?.suggestion?.targetRoles).toContain('primary')
      expect(result?.suggestion?.targetProperty).toBe('textColor')
    })
  })

  describe('impressionの基本色の例外的な組み合わせ', () => {
    it('テキスト色がimpressionの基本色, 背景色がsurface系統', () => {
      const result1_1 = validate('primary', 'surfaceContainerLowest')
      const result1_2 = validate('surfaceContainerLowest', 'primary')
      expect(result1_1).toBeNull()
      expect(result1_2).toBeNull()
      const result2_1 = validate('secondary', 'surface')
      expect(result2_1).toBeNull()
      const result3_1 = validate('tertiary', 'surfaceContainerHigh')
      const result3_2 = validate('surfaceContainerHigh', 'tertiary')
      expect(result3_1).toBeNull()
      expect(result3_2).toBeNull()
      const result4_1 = validate('notice', 'surfaceContainer')
      const result4_2 = validate('surfaceContainer', 'notice')
      expect(result4_1).toBeNull()
      expect(result4_2).toBeNull()
      const result5_1 = validate('negative', 'surfaceContainerHighest')
      const result5_2 = validate('surfaceContainerHighest', 'negative')
      expect(result5_1).toBeNull()
      expect(result5_2).toBeNull()
      const result6_1 = validate('positive', 'surfaceContainerLow')
      const result6_2 = validate('surfaceContainerLow', 'positive')
      expect(result6_1).toBeNull()
      expect(result6_2).toBeNull()
    })
  })

  describe('ペアリングテーブルの双方向整合性', () => {
    it('背景色から許可されたテキスト色の組み合わせがすべて正常と判定される', () => {
      for (const [bgRole, textRoles] of Object.entries(BACKGROUND_COLOR_PAIRS)) {
        const roles =
          typeof textRoles === 'string' ? [textRoles] : (textRoles as string[])
        for (const textRole of roles) {
          expect({
            pair: `text=${textRole}, bg=${bgRole}`,
            result: validate(textRole, bgRole),
          }).toEqual({
            pair: `text=${textRole}, bg=${bgRole}`,
            result: null,
          })
        }
      }
    })
    it('テキスト色から許可された背景色の組み合わせがすべて正常と判定される', () => {
      for (const [textRole, bgRoles] of Object.entries(TEXT_COLOR_PAIRS)) {
        const roles =
          typeof bgRoles === 'string' ? [bgRoles] : (bgRoles as string[])
        for (const bgRole of roles) {
          expect({
            pair: `text=${textRole}, bg=${bgRole}`,
            result: validate(textRole, bgRole),
          }).toEqual({
            pair: `text=${textRole}, bg=${bgRole}`,
            result: null,
          })
        }
      }
    })
  })

  describe('onSurfaceVariantの特例', () => {
    it('テキスト色がonSurfaceVariantのとき、背景色は任意', () => {
      const result = validate('onSurfaceVariant', 'randomColor')
      expect(result).toBeNull()
    })
    it('背景色がsurface系列のとき、テキスト色の候補としてonSurfaceVariantを提案', () => {
      const result1 = validate('onNotice', 'surfaceContainerLowest')
      const result2 = validate('onNotice', 'surfaceContainerLow')
      const result3 = validate('onNotice', 'surfaceContainer')
      const result4 = validate('onNotice', 'surfaceContainerHigh')
      const result5 = validate('onNotice', 'surfaceContainerHighest')
      expect(result1?.messageDetails).toContain('onSurfaceVariant')
      expect(result2?.messageDetails).toContain('onSurfaceVariant')
      expect(result3?.messageDetails).toContain('onSurfaceVariant')
      expect(result4?.messageDetails).toContain('onSurfaceVariant')
      expect(result5?.messageDetails).toContain('onSurfaceVariant')
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
