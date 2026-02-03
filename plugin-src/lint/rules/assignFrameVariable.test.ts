import validate from './assignFrameVariable'
import { CUSTOM_VALUE } from '../../../shared-src/models/Rules'

describe('assignFrameVariable', () => {
  describe('適切な背景色', () => {
    it('primaryの場合', () => {
      const result = validate('color/component/primary')
      expect(result).toBeNull()
    })

    it('surfaceの場合', () => {
      const result = validate('color/component/surface')
      expect(result).toBeNull()
    })

    it('primaryContainerの場合', () => {
      const result = validate('color/component/primaryContainer')
      expect(result).toBeNull()
    })
  })

  describe('不適切な背景色', () => {
    it('onから始まる場合', () => {
      const result = validate('color/component/onPrimary')
      expect(result).not.toBeNull()
      expect(result?.severity).toBe('error')
      expect(result?.message).toBe('背景色が不適切')
    })

    it('Onが途中にある場合', () => {
      const result = validate('color/component/hoveredOnPrimary')
      expect(result).not.toBeNull()
      expect(result?.severity).toBe('error')
      expect(result?.message).toBe('背景色が不適切')
    })

    it('テキスト色があればsuggestionが付く', () => {
      const result = validate(
        'color/component/onPrimary',
        'color/component/onPrimary'
      )
      expect(result?.severity).toBe('error')
      expect(result?.suggestion).toEqual({
        targetRoles: ['primary'],
        targetProperty: 'backgroundColor',
      })
    })

    it('テキスト色がなければsuggestionは付かない', () => {
      const result = validate('color/component/onPrimary')
      expect(result?.severity).toBe('error')
      expect(result?.suggestion).toBeUndefined()
    })

    it('テキスト色がTEXT_COLOR_PAIRSにない場合はsuggestionなし', () => {
      const result = validate(
        'color/component/onPrimary',
        'color/component/outline'
      )
      expect(result?.severity).toBe('error')
      expect(result?.suggestion).toBeUndefined()
    })
  })

  describe('プロパティなし（null） → 許容', () => {
    it('背景色がnullの場合', () => {
      const result = validate(null)
      expect(result).toBeNull()
    })
  })

  describe('手動値（CUSTOM_VALUE） → warning', () => {
    it('テキスト色なし → warning', () => {
      const result = validate(CUSTOM_VALUE)
      expect(result?.severity).toBe('warning')
      expect(result?.message).toBe('背景色にデザイントークンを使えます')
      expect(result?.suggestion).toBeUndefined()
    })

    it('テキスト色あり → warning + suggestion', () => {
      const result = validate(CUSTOM_VALUE, 'color/component/onPrimary')
      expect(result?.severity).toBe('warning')
      expect(result?.message).toBe('背景色にデザイントークンを使えます')
      expect(result?.suggestion).toEqual({
        targetRoles: ['primary'],
        targetProperty: 'backgroundColor',
      })
    })
  })

  describe('カラーロールがない背景色', () => {
    it('リファレンストークンの場合', () => {
      const result = validate('sd/reference/color/scale/gray/500')
      expect(result).toBeNull()
    })

    it('テキスト色なし → warning', () => {
      const result = validate('color/component/customColor')
      expect(result?.severity).toBe('warning')
      expect(result?.message).toBe('背景色にデザイントークンを使えます')
      expect(result?.suggestion).toBeUndefined()
    })

    it('テキスト色がTEXT_COLOR_PAIRSにない → warning', () => {
      const result = validate(
        'color/component/customColor',
        'color/component/outline'
      )
      expect(result?.severity).toBe('warning')
      expect(result?.suggestion).toBeUndefined()
    })
  })

  describe('相方の色からsuggestionを計算', () => {
    it('テキスト色がシステムトークンで候補がある場合 → warning + suggestion', () => {
      const result = validate(
        'color/component/customColor',
        'color/component/onPrimary'
      )
      expect(result?.severity).toBe('warning')
      expect(result?.message).toBe('背景色にデザイントークンを使えます')
      expect(result?.suggestion).toEqual({
        targetRoles: ['primary'],
        targetProperty: 'backgroundColor',
      })
    })

    it('onSurfaceテキスト → 全候補を提案', () => {
      const result = validate(
        'color/component/customColor',
        'color/component/onSurface'
      )
      expect(result?.severity).toBe('warning')
      expect(result?.suggestion?.targetRoles).toContain('surface')
      expect(result?.suggestion?.targetRoles).toContain(
        'surfaceContainerLowest'
      )
      expect(result?.suggestion?.targetRoles).toContain(
        'surfaceContainerHighest'
      )
      expect(result?.suggestion?.targetProperty).toBe('backgroundColor')
    })

    it('onSecondaryテキスト → secondaryを提案', () => {
      const result = validate(
        'color/component/customColor',
        'color/component/onSecondary'
      )
      expect(result?.severity).toBe('warning')
      expect(result?.suggestion).toEqual({
        targetRoles: ['secondary'],
        targetProperty: 'backgroundColor',
      })
    })

    it('primaryテキスト（impression基本色）→ surface系全候補を提案', () => {
      const result = validate(
        'color/component/customColor',
        'color/component/primary'
      )
      expect(result?.severity).toBe('warning')
      expect(result?.suggestion?.targetRoles).toContain('surface')
      expect(result?.suggestion?.targetRoles).toContain(
        'surfaceContainerLowest'
      )
      expect(result?.suggestion?.targetProperty).toBe('backgroundColor')
    })
  })
})
