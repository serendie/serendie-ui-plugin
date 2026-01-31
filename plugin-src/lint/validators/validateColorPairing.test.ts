import validateColorPairing from './validateColorPairing'
import { ColorInfo } from '../extractors/extractColorInfo'
import { DesignTokenIssue } from '../../../shared-src/models/Rules'

function makeColorInfo(overrides: Partial<ColorInfo> = {}): ColorInfo {
  return {
    nodeId: 'node-1',
    nodeName: 'TestNode',
    nodeType: 'TEXT',
    textColor: null,
    backgroundColor: null,
    ...overrides,
  }
}

function getSuggestion(colorInfo: ColorInfo) {
  const { issues } = validateColorPairing([colorInfo])
  return (issues[0] as DesignTokenIssue | undefined)?.suggestion
}

describe('validateColorPairing suggestion', () => {
  describe('背景色優先でテキスト色を提案', () => {
    it('onSecondary + primary背景 → onPrimaryを提案', () => {
      const suggestion = getSuggestion(
        makeColorInfo({
          textColor: 'sd/system/color/impression/onSecondary',
          backgroundColor: 'sd/system/color/impression/primary',
        })
      )
      expect(suggestion).toEqual({
        targetRole: 'onPrimary',
        targetProperty: 'textColor',
      })
    })

    it('onPrimary + secondary背景 → onSecondaryを提案', () => {
      const suggestion = getSuggestion(
        makeColorInfo({
          textColor: 'sd/system/color/impression/onPrimary',
          backgroundColor: 'sd/system/color/impression/secondary',
        })
      )
      expect(suggestion).toEqual({
        targetRole: 'onSecondary',
        targetProperty: 'textColor',
      })
    })

    it('onPrimary + surface背景（配列候補）→ 先頭のprimaryを提案', () => {
      const suggestion = getSuggestion(
        makeColorInfo({
          textColor: 'sd/system/color/impression/onPrimary',
          backgroundColor: 'sd/system/color/impression/surface',
        })
      )
      expect(suggestion).toEqual({
        targetRole: 'primary',
        targetProperty: 'textColor',
      })
    })

    it('onPrimaryContainer + secondary背景 → onSecondaryを提案', () => {
      const suggestion = getSuggestion(
        makeColorInfo({
          textColor: 'sd/system/color/impression/onPrimaryContainer',
          backgroundColor: 'sd/system/color/impression/secondary',
        })
      )
      expect(suggestion).toEqual({
        targetRole: 'onSecondary',
        targetProperty: 'textColor',
      })
    })
  })

  describe('suggestionが付かないケース', () => {
    it('適切なペアの場合はissue自体がない', () => {
      const suggestion = getSuggestion(
        makeColorInfo({
          textColor: 'sd/system/color/impression/onPrimary',
          backgroundColor: 'sd/system/color/impression/primary',
        })
      )
      expect(suggestion).toBeUndefined()
    })

    it('背景色がnull', () => {
      const suggestion = getSuggestion(
        makeColorInfo({
          textColor: 'sd/system/color/impression/onPrimary',
          backgroundColor: null,
        })
      )
      expect(suggestion).toBeUndefined()
    })
  })
})
