import validate from './assignTextVariable'
import { CUSTOM_VALUE } from '../../../shared-src/models/Rules'

describe('assignTextVariable', () => {
  describe('適切なテキスト色', () => {
    it('onから始まる場合', () => {
      const result = validate('color/component/onPrimary')
      expect(result).toBeNull()
    })

    it('Onが途中にある場合', () => {
      const result = validate('color/component/hoveredOnPrimary')
      expect(result).toBeNull()
    })
  })

  describe('テキストに使えるimpressionの基本色', () => {
    it('primaryの場合', () => {
      const result = validate('color/component/primary')
      expect(result).toBeNull()
    })
    it('secondaryの場合', () => {
      const result = validate('color/component/secondary')
      expect(result).toBeNull()
    })
    it('tertiaryの場合', () => {
      const result = validate('color/component/tertiary')
      expect(result).toBeNull()
    })
    it('noticeの場合', () => {
      const result = validate('color/component/notice')
      expect(result).toBeNull()
    })
    it('negativeの場合', () => {
      const result = validate('color/component/negative')
      expect(result).toBeNull()
    })
    it('positiveの場合', () => {
      const result = validate('color/component/positive')
      expect(result).toBeNull()
    })
  })

  describe('不適切なテキスト色', () => {
    it('primaryContainerの場合', () => {
      const result = validate('color/component/primaryContainer')
      expect(result).not.toBeNull()
      expect(result?.severity).toBe('error')
      expect(result?.message).toBe('テキスト色が不適切')
    })

    it('outlineの場合', () => {
      const result = validate('color/component/outline')
      expect(result).not.toBeNull()
      expect(result?.severity).toBe('error')
      expect(result?.message).toBe('テキスト色が不適切')
    })

    it('背景色があればsuggestionが付く', () => {
      const result = validate(
        'color/component/primaryContainer',
        'color/component/primary'
      )
      expect(result?.severity).toBe('error')
      expect(result?.suggestion).toEqual({
        targetRoles: ['onPrimary'],
        targetProperty: 'textColor',
      })
    })

    it('背景色がなければsuggestionは付かない', () => {
      const result = validate('color/component/primaryContainer')
      expect(result?.severity).toBe('error')
      expect(result?.suggestion).toBeUndefined()
    })

    it('背景色がBACKGROUND_COLOR_PAIRSにない場合はsuggestionなし', () => {
      const result = validate(
        'color/component/primaryContainer',
        'color/component/outline'
      )
      expect(result?.severity).toBe('error')
      expect(result?.suggestion).toBeUndefined()
    })
  })

  describe('プロパティなし（null） → 許容', () => {
    it('テキストカラーがnullの場合', () => {
      const result = validate(null)
      expect(result).toBeNull()
    })
  })

  describe('手動値（CUSTOM_VALUE） → warning', () => {
    it('背景色なし → warning', () => {
      const result = validate(CUSTOM_VALUE)
      expect(result?.severity).toBe('warning')
      expect(result?.message).toBe('テキスト色にデザイントークンを使えます')
      expect(result?.suggestion).toBeUndefined()
    })

    it('背景色あり → warning + suggestion', () => {
      const result = validate(CUSTOM_VALUE, 'color/component/primary')
      expect(result?.severity).toBe('warning')
      expect(result?.message).toBe('テキスト色にデザイントークンを使えます')
      expect(result?.suggestion).toEqual({
        targetRoles: ['onPrimary'],
        targetProperty: 'textColor',
      })
    })
  })

  describe('カラーロールがないテキスト色', () => {
    it('リファレンストークンの場合', () => {
      const result = validate('sd/reference/color/scale/gray/500')
      expect(result).toBeNull()
    })

    it('背景色なし → warning', () => {
      const result = validate('color/component/customColor')
      expect(result?.severity).toBe('warning')
      expect(result?.message).toBe('テキスト色にデザイントークンを使えます')
      expect(result?.suggestion).toBeUndefined()
    })

    it('背景色がBACKGROUND_COLOR_PAIRSにない → warning', () => {
      const result = validate(
        'color/component/customColor',
        'color/component/outline'
      )
      expect(result?.severity).toBe('warning')
      expect(result?.suggestion).toBeUndefined()
    })
  })

  describe('相方の色からsuggestionを計算', () => {
    it('背景色がシステムトークンで候補がある場合 → warning + suggestion', () => {
      const result = validate(
        'color/component/customColor',
        'color/component/primary'
      )
      expect(result?.severity).toBe('warning')
      expect(result?.message).toBe('テキスト色にデザイントークンを使えます')
      expect(result?.suggestion).toEqual({
        targetRoles: ['onPrimary'],
        targetProperty: 'textColor',
      })
    })

    it('surface背景 → 全候補を提案', () => {
      const result = validate(
        'color/component/customColor',
        'color/component/surface'
      )
      expect(result?.severity).toBe('warning')
      expect(result?.suggestion?.targetRoles).toContain('onSurface')
      expect(result?.suggestion?.targetRoles).toContain('onSurfaceVariant')
      expect(result?.suggestion?.targetRoles).toContain('primary')
      expect(result?.suggestion?.targetProperty).toBe('textColor')
    })

    it('surfaceContainerHigh背景 → onSurface等を含む候補を提案', () => {
      const result = validate(
        'color/component/customColor',
        'color/component/surfaceContainerHigh'
      )
      expect(result?.severity).toBe('warning')
      expect(result?.suggestion?.targetRoles).toContain('onSurface')
      expect(result?.suggestion?.targetRoles).toContain('onSurfaceVariant')
      expect(result?.suggestion?.targetProperty).toBe('textColor')
    })

    it('primaryContainer背景 → onPrimaryContainerを提案', () => {
      const result = validate(
        'color/component/customColor',
        'color/component/primaryContainer'
      )
      expect(result?.severity).toBe('warning')
      expect(result?.suggestion).toEqual({
        targetRoles: ['onPrimaryContainer'],
        targetProperty: 'textColor',
      })
    })
  })
})
