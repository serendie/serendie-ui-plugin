import validate from './assignFrameVariable'

describe('assignFrameVariable', () => {
  describe('適切な背景色', () => {
    it('primaryの場合', () => {
      const result = validate('primary')
      expect(result).toBeNull()
    })

    it('surfaceの場合', () => {
      const result = validate('surface')
      expect(result).toBeNull()
    })

    it('primaryContainerの場合', () => {
      const result = validate('primaryContainer')
      expect(result).toBeNull()
    })
  })

  describe('不適切な背景色', () => {
    it('onから始まる場合', () => {
      const result = validate('onPrimary')
      expect(result).not.toBeNull()
      expect(result?.severity).toBe('error')
      expect(result?.message).toBe('背景色が不適切')
    })

    it('Onが途中にある場合', () => {
      const result = validate('hoveredOnPrimary')
      expect(result).not.toBeNull()
      expect(result?.severity).toBe('error')
      expect(result?.message).toBe('背景色が不適切')
    })

    it('テキスト色があればsuggestionが付く', () => {
      const result = validate('onPrimary', 'onPrimary')
      expect(result?.severity).toBe('error')
      expect(result?.suggestion).toEqual({
        targetRole: 'primary',
        targetProperty: 'backgroundColor',
      })
    })

    it('テキスト色がなければsuggestionは付かない', () => {
      const result = validate('onPrimary')
      expect(result?.severity).toBe('error')
      expect(result?.suggestion).toBeUndefined()
    })

    it('テキスト色がTEXT_COLOR_PAIRSにない場合はsuggestionなし', () => {
      const result = validate('onPrimary', 'outline')
      expect(result?.severity).toBe('error')
      expect(result?.suggestion).toBeUndefined()
    })
  })

  describe('カラーロールがない背景色', () => {
    it('リファレンストークンの場合', () => {
      const result = validate('sd/reference/color/scale/gray/500')
      expect(result).toBeNull()
    })

    it('背景色がない場合', () => {
      const result = validate(null)
      expect(result).toBeNull()
    })

    it('テキスト色なし → warning', () => {
      const result = validate('customColor')
      expect(result?.severity).toBe('warning')
      expect(result?.message).toBe('背景色にシステムトークンを未使用')
      expect(result?.suggestion).toBeUndefined()
    })

    it('テキスト色がTEXT_COLOR_PAIRSにない → warning', () => {
      const result = validate('customColor', 'outline')
      expect(result?.severity).toBe('warning')
      expect(result?.suggestion).toBeUndefined()
    })
  })

  describe('相方の色からsuggestionを計算', () => {
    it('テキスト色がシステムトークンで候補がある場合 → warning + suggestion', () => {
      const result = validate('customColor', 'onPrimary')
      expect(result?.severity).toBe('warning')
      expect(result?.message).toBe('背景色にシステムトークンを未使用')
      expect(result?.suggestion).toEqual({
        targetRole: 'primary',
        targetProperty: 'backgroundColor',
      })
    })

    it('onSurfaceテキスト → 先頭候補surfaceを提案', () => {
      const result = validate('customColor', 'onSurface')
      expect(result?.severity).toBe('warning')
      expect(result?.suggestion).toEqual({
        targetRole: 'surface',
        targetProperty: 'backgroundColor',
      })
    })

    it('onSecondaryテキスト → secondaryを提案', () => {
      const result = validate('customColor', 'onSecondary')
      expect(result?.severity).toBe('warning')
      expect(result?.suggestion).toEqual({
        targetRole: 'secondary',
        targetProperty: 'backgroundColor',
      })
    })

    it('primaryテキスト（impression基本色）→ surfaceを提案', () => {
      const result = validate('customColor', 'primary')
      expect(result?.severity).toBe('warning')
      expect(result?.suggestion).toEqual({
        targetRole: 'surface',
        targetProperty: 'backgroundColor',
      })
    })
  })
})
