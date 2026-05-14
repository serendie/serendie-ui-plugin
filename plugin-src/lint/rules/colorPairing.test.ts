import validate from './colorPairing'
import {
  TEXT_COLOR_PAIRS,
  BACKGROUND_COLOR_PAIRS,
  CUSTOM_VALUE,
} from '../../../shared-src/models/Rules'

describe('colorPairing', () => {
  describe('正常なカラーペアリング', () => {
    it('1対1対応', () => {
      const result = validate(
        'color/component/onNegative',
        'color/component/negative'
      )
      expect(result).toBeNull()
    })

    it('1対1対応（逆順）', () => {
      const result = validate(
        'color/component/negative',
        'color/component/onNegative'
      )
      expect(result).toBeNull()
    })

    it('多対多対応', () => {
      const result = validate(
        'color/component/onSurface',
        'color/component/surfaceContainerLowest'
      )
      expect(result).toBeNull()
    })

    it('多対多対応（逆順）', () => {
      const result = validate(
        'color/component/surfaceContainerLowest',
        'color/component/onSurface'
      )
      expect(result).toBeNull()
    })
  })

  describe('不適切なカラーペアリング', () => {
    it('同色組み合わせ', () => {
      const result = validate(
        'color/component/primary',
        'color/component/primary'
      )
      expect(result).not.toBeNull()
      expect(result?.severity).toBe('error')
      expect(result?.message).toBe('色の組み合わせが不適切')
    })

    it('異なるロールの組み合わせ', () => {
      const result = validate(
        'color/component/primary',
        'color/component/secondary'
      )
      expect(result).not.toBeNull()
      expect(result?.message).toBe('色の組み合わせが不適切')
    })

    it('背景色からsuggestionが付く', () => {
      const result = validate(
        'color/component/onSecondary',
        'color/component/primary'
      )
      expect(result?.suggestion).toEqual({
        targetRoles: ['onPrimary'],
        targetProperty: 'textColor',
      })
    })

    it('背景色が配列候補の場合は全候補を提案', () => {
      const result = validate(
        'color/component/onPrimary',
        'color/component/surface'
      )
      expect(result?.suggestion?.targetRoles).toContain('onSurface')
      expect(result?.suggestion?.targetRoles).toContain('onSurfaceVariant')
      expect(result?.suggestion?.targetRoles).toContain('primary')
      expect(result?.suggestion?.targetProperty).toBe('textColor')
    })

    it('secondaryはsurface系との組み合わせ不可（コントラスト比不足）', () => {
      const result = validate(
        'color/component/secondary',
        'color/component/surface'
      )
      expect(result?.severity).toBe('error')
    })

    it('tertiaryはsurface系との組み合わせ不可（コントラスト比不足）', () => {
      const result = validate(
        'color/component/tertiary',
        'color/component/surfaceContainerHigh'
      )
      expect(result?.severity).toBe('error')
    })
  })

  describe('impressionの基本色とsurface系の組み合わせ', () => {
    it('primary × surface系は有効', () => {
      expect(
        validate(
          'color/component/primary',
          'color/component/surfaceContainerLowest'
        )
      ).toBeNull()
      expect(
        validate(
          'color/component/surfaceContainerLowest',
          'color/component/primary'
        )
      ).toBeNull()
    })

    it('notice × surface系は有効', () => {
      expect(
        validate('color/component/notice', 'color/component/surfaceContainer')
      ).toBeNull()
      expect(
        validate('color/component/surfaceContainer', 'color/component/notice')
      ).toBeNull()
    })

    it('negative × surface系は有効', () => {
      expect(
        validate(
          'color/component/negative',
          'color/component/surfaceContainerHighest'
        )
      ).toBeNull()
      expect(
        validate(
          'color/component/surfaceContainerHighest',
          'color/component/negative'
        )
      ).toBeNull()
    })

    it('positive × surface系は有効', () => {
      expect(
        validate(
          'color/component/positive',
          'color/component/surfaceContainerLow'
        )
      ).toBeNull()
      expect(
        validate(
          'color/component/surfaceContainerLow',
          'color/component/positive'
        )
      ).toBeNull()
    })
  })

  describe('ペアリングテーブルの双方向整合性', () => {
    it('背景色から許可されたテキスト色の組み合わせがすべて正常と判定される', () => {
      for (const [bgRole, textRoles] of Object.entries(
        BACKGROUND_COLOR_PAIRS
      )) {
        const roles = textRoles
        for (const textRole of roles) {
          expect({
            pair: `text=${textRole}, bg=${bgRole}`,
            result: validate(
              `color/component/${textRole}`,
              `color/component/${bgRole}`
            ),
          }).toEqual({
            pair: `text=${textRole}, bg=${bgRole}`,
            result: null,
          })
        }
      }
    })
    it('テキスト色から許可された背景色の組み合わせがすべて正常と判定される', () => {
      for (const [textRole, bgRoles] of Object.entries(TEXT_COLOR_PAIRS)) {
        const roles = bgRoles
        for (const bgRole of roles) {
          expect({
            pair: `text=${textRole}, bg=${bgRole}`,
            result: validate(
              `color/component/${textRole}`,
              `color/component/${bgRole}`
            ),
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
      const result = validate(
        'color/component/onSurfaceVariant',
        'color/component/randomColor'
      )
      expect(result).toBeNull()
    })
    it('背景色がsurface系列のとき、テキスト色の候補としてonSurfaceVariantを提案', () => {
      const result1 = validate(
        'color/component/onNotice',
        'color/component/surfaceContainerLowest'
      )
      const result2 = validate(
        'color/component/onNotice',
        'color/component/surfaceContainerLow'
      )
      const result3 = validate(
        'color/component/onNotice',
        'color/component/surfaceContainer'
      )
      const result4 = validate(
        'color/component/onNotice',
        'color/component/surfaceContainerHigh'
      )
      const result5 = validate(
        'color/component/onNotice',
        'color/component/surfaceContainerHighest'
      )
      expect(result1?.messageDetails).toContain('onSurfaceVariant')
      expect(result2?.messageDetails).toContain('onSurfaceVariant')
      expect(result3?.messageDetails).toContain('onSurfaceVariant')
      expect(result4?.messageDetails).toContain('onSurfaceVariant')
      expect(result5?.messageDetails).toContain('onSurfaceVariant')
    })
  })

  describe('無効な入力の処理', () => {
    it('テキスト色がない場合', () => {
      const result = validate(null, 'color/component/primary')
      expect(result).toBeNull()
    })

    it('背景色がない場合', () => {
      const result = validate('color/component/onPrimary', null)
      expect(result).toBeNull()
    })

    it('テキスト色も背景色もない場合', () => {
      const result = validate(null, null)
      expect(result).toBeNull()
    })

    it('テキスト色がCUSTOM_VALUEの場合', () => {
      const result = validate(CUSTOM_VALUE, 'color/component/primary')
      expect(result).toBeNull()
    })

    it('背景色がCUSTOM_VALUEの場合', () => {
      const result = validate('color/component/onPrimary', CUSTOM_VALUE)
      expect(result).toBeNull()
    })
  })

  describe('認識できないカラーロール', () => {
    it('テキスト色が認識できないロールの場合', () => {
      const result = validate(
        'color/component/unknownColor',
        'color/component/primary'
      )
      expect(result).toBeNull()
    })

    it('背景色が認識できないロールの場合', () => {
      const result = validate(
        'color/component/onPrimary',
        'color/component/unknownColor'
      )
      expect(result).toBeNull()
    })

    it('テキスト色も背景色も認識できないロールの場合', () => {
      const result = validate(
        'color/component/unknownColor1',
        'color/component/unknownColor2'
      )
      expect(result).toBeNull()
    })
  })
})
