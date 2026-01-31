import validate from './assignTextVariable'

describe('assignTextVariable', () => {
  describe('適切なテキスト色', () => {
    it('onから始まる場合', () => {
      const result = validate('onPrimary')
      expect(result).toBeNull()
    })

    it('Onが途中にある場合', () => {
      const result = validate('hoveredOnPrimary')
      expect(result).toBeNull()
    })
  })

  describe('テキストに使えるimpressionの基本色', () => {
    it('primaryの場合', () => {
      const result = validate('primary')
      expect(result).toBeNull()
    })
    it('secondaryの場合', () => {
      const result = validate('secondary')
      expect(result).toBeNull()
    })
    it('tertiaryの場合', () => {
      const result = validate('tertiary')
      expect(result).toBeNull()
    })
    it('noticeの場合', () => {
      const result = validate('notice')
      expect(result).toBeNull()
    })
    it('negativeの場合', () => {
      const result = validate('negative')
      expect(result).toBeNull()
    })
    it('positiveの場合', () => {
      const result = validate('positive')
      expect(result).toBeNull()
    })
  })

  describe('不適切なテキスト色', () => {
    it('primaryContainerの場合', () => {
      const result = validate('primaryContainer')
      expect(result).not.toBeNull()
      expect(result?.severity).toBe('error')
      expect(result?.message).toBe('テキスト色が不適切')
    })

    it('outlineの場合', () => {
      const result = validate('outline')
      expect(result).not.toBeNull()
      expect(result?.severity).toBe('error')
      expect(result?.message).toBe('テキスト色が不適切')
    })

    it('背景色があればsuggestionが付く', () => {
      const result = validate('primaryContainer', 'primary')
      expect(result?.severity).toBe('error')
      expect(result?.suggestion).toEqual({
        targetRole: 'onPrimary',
        targetProperty: 'textColor',
      })
    })

    it('背景色がなければsuggestionは付かない', () => {
      const result = validate('primaryContainer')
      expect(result?.severity).toBe('error')
      expect(result?.suggestion).toBeUndefined()
    })

    it('背景色がBACKGROUND_COLOR_PAIRSにない場合はsuggestionなし', () => {
      const result = validate('primaryContainer', 'outline')
      expect(result?.severity).toBe('error')
      expect(result?.suggestion).toBeUndefined()
    })
  })

  describe('カラーロールがないテキスト色', () => {
    it('リファレンストークンの場合', () => {
      const result = validate('sd/reference/color/scale/gray/500')
      expect(result).toBeNull()
    })

    it('テキストカラーがない場合', () => {
      const result = validate(null)
      expect(result).toBeNull()
    })

    it('背景色なし → warning', () => {
      const result = validate('customColor')
      expect(result?.severity).toBe('warning')
      expect(result?.message).toBe('テキスト色にシステムトークンを未使用')
      expect(result?.suggestion).toBeUndefined()
    })

    it('背景色がBACKGROUND_COLOR_PAIRSにない → warning', () => {
      const result = validate('customColor', 'outline')
      expect(result?.severity).toBe('warning')
      expect(result?.suggestion).toBeUndefined()
    })
  })

  describe('相方の色からsuggestionを計算', () => {
    it('背景色がシステムトークンで候補がある場合 → warning + suggestion', () => {
      const result = validate('customColor', 'primary')
      expect(result?.severity).toBe('warning')
      expect(result?.message).toBe('テキスト色にシステムトークンを未使用')
      expect(result?.suggestion).toEqual({
        targetRole: 'onPrimary',
        targetProperty: 'textColor',
      })
    })

    it('surface背景 → 先頭候補onSurfaceを提案', () => {
      const result = validate('customColor', 'surface')
      expect(result?.severity).toBe('warning')
      expect(result?.suggestion).toEqual({
        targetRole: 'onSurface',
        targetProperty: 'textColor',
      })
    })

    it('surfaceContainerHigh背景 → onSurfaceを提案', () => {
      const result = validate('customColor', 'surfaceContainerHigh')
      expect(result?.severity).toBe('warning')
      expect(result?.suggestion).toEqual({
        targetRole: 'onSurface',
        targetProperty: 'textColor',
      })
    })

    it('primaryContainer背景 → onPrimaryContainerを提案', () => {
      const result = validate('customColor', 'primaryContainer')
      expect(result?.severity).toBe('warning')
      expect(result?.suggestion).toEqual({
        targetRole: 'onPrimaryContainer',
        targetProperty: 'textColor',
      })
    })
  })
})
