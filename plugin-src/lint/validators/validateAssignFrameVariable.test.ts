import validateAssignFrameVariable from './validateAssignFrameVariable'
import { ColorInfo } from '../extractors/extractColorInfo'
import { DesignTokenIssue } from '../../../shared-src/models/Rules'

function makeColorInfo(overrides: Partial<ColorInfo> = {}): ColorInfo {
  return {
    nodeId: 'node-1',
    nodeName: 'TestFrame',
    nodeType: 'FRAME',
    textColor: null,
    backgroundColor: null,
    ...overrides,
  }
}

function getSuggestion(colorInfo: ColorInfo) {
  const { issues } = validateAssignFrameVariable([colorInfo])
  return (issues[0] as DesignTokenIssue | undefined)?.suggestion
}

describe('validateAssignFrameVariable suggestion', () => {
  describe('テキスト色から背景色を提案', () => {
    it('onPrimaryテキスト色 → primaryを提案', () => {
      const suggestion = getSuggestion(
        makeColorInfo({
          backgroundColor: 'onPrimary',
          textColor: 'sd/system/color/impression/onPrimary',
        })
      )
      expect(suggestion).toEqual({
        targetRole: 'primary',
        targetProperty: 'backgroundColor',
      })
    })

    it('onSecondaryテキスト色 → secondaryを提案', () => {
      const suggestion = getSuggestion(
        makeColorInfo({
          backgroundColor: 'onSecondary',
          textColor: 'sd/system/color/impression/onSecondary',
        })
      )
      expect(suggestion).toEqual({
        targetRole: 'secondary',
        targetProperty: 'backgroundColor',
      })
    })

    it('onSurfaceテキスト色（配列候補）→ 先頭のsurfaceを提案', () => {
      const suggestion = getSuggestion(
        makeColorInfo({
          backgroundColor: 'onSurface',
          textColor: 'sd/system/color/impression/onSurface',
        })
      )
      expect(suggestion).toEqual({
        targetRole: 'surface',
        targetProperty: 'backgroundColor',
      })
    })
  })

  describe('suggestionが付かないケース', () => {
    it('warningの場合', () => {
      const suggestion = getSuggestion(
        makeColorInfo({ backgroundColor: 'customColor' })
      )
      expect(suggestion).toBeUndefined()
    })

    it('テキスト色がnull', () => {
      const suggestion = getSuggestion(
        makeColorInfo({
          backgroundColor: 'onPrimary',
          textColor: null,
        })
      )
      expect(suggestion).toBeUndefined()
    })

    it('テキスト色ロールがTEXT_COLOR_PAIRSにない', () => {
      const suggestion = getSuggestion(
        makeColorInfo({
          backgroundColor: 'onPrimary',
          textColor: 'sd/system/color/impression/outline',
        })
      )
      expect(suggestion).toBeUndefined()
    })
  })
})
