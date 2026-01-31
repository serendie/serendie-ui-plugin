import validateAssignTextVariable from './validateAssignTextVariable'
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
  const { issues } = validateAssignTextVariable([colorInfo])
  return (issues[0] as DesignTokenIssue | undefined)?.suggestion
}

describe('validateAssignTextVariable suggestion', () => {
  describe('背景色からテキスト色を提案', () => {
    it('primary背景 → onPrimaryを提案', () => {
      const suggestion = getSuggestion(
        makeColorInfo({
          textColor: 'primaryContainer',
          backgroundColor: 'sd/system/color/impression/primary',
        })
      )
      expect(suggestion).toEqual({
        targetRole: 'onPrimary',
        targetProperty: 'textColor',
      })
    })

    it('secondary背景 → onSecondaryを提案', () => {
      const suggestion = getSuggestion(
        makeColorInfo({
          textColor: 'outline',
          backgroundColor: 'sd/system/color/impression/secondary',
        })
      )
      expect(suggestion).toEqual({
        targetRole: 'onSecondary',
        targetProperty: 'textColor',
      })
    })

    it('surface背景（配列候補）→ 先頭のprimaryを提案', () => {
      const suggestion = getSuggestion(
        makeColorInfo({
          textColor: 'primaryContainer',
          backgroundColor: 'sd/system/color/impression/surface',
        })
      )
      expect(suggestion).toEqual({
        targetRole: 'primary',
        targetProperty: 'textColor',
      })
    })
  })

  describe('suggestionが付かないケース', () => {
    it('warningの場合', () => {
      const suggestion = getSuggestion(
        makeColorInfo({ textColor: 'customColor' })
      )
      expect(suggestion).toBeUndefined()
    })

    it('背景色がnull', () => {
      const suggestion = getSuggestion(
        makeColorInfo({
          textColor: 'primaryContainer',
          backgroundColor: null,
        })
      )
      expect(suggestion).toBeUndefined()
    })

    it('背景色ロールがBACKGROUND_COLOR_PAIRSにない', () => {
      const suggestion = getSuggestion(
        makeColorInfo({
          textColor: 'primaryContainer',
          backgroundColor: 'sd/system/color/impression/outline',
        })
      )
      expect(suggestion).toBeUndefined()
    })
  })
})
