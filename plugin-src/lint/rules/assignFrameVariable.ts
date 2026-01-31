import {
  RuleResult,
  TEXT_COLOR_PAIRS,
  DesignTokenSuggestion,
  formatRoles,
} from '../../../shared-src/models/Rules'
import extractColorRole from '../core/extractColorRole'

function computeSuggestion(
  textColor: string
): DesignTokenSuggestion | undefined {
  const textRole = extractColorRole(textColor)
  if (!textRole || !(textRole in TEXT_COLOR_PAIRS)) return undefined
  const candidates = TEXT_COLOR_PAIRS[textRole]
  const targetRoles = typeof candidates === 'string' ? [candidates] : candidates
  if (targetRoles.length === 0) return undefined
  return { targetRoles, targetProperty: 'backgroundColor' }
}

export default function validate(
  backgroundColor: string | null,
  textColor?: string | null
): RuleResult | null {
  if (!backgroundColor || backgroundColor.match(/^sd\/reference/)) {
    return null
  }

  const backgroundRole = extractColorRole(backgroundColor)
  if (!backgroundRole) {
    const suggestion = textColor
      ? computeSuggestion(textColor)
      : undefined
    return {
      severity: 'warning',
      message: '背景色にシステムトークンを未使用',
      messageDetails: suggestion
        ? `塗りを${formatRoles(suggestion.targetRoles)}に変更してください。`
        : '塗りにデザインシステムのバリアブルを設定してください。',
      suggestion,
    }
  }

  if (backgroundColor.match(/^on/) || backgroundColor.match(/^\w+On[A-Z]/)) {
    const suggestion = textColor
      ? computeSuggestion(textColor)
      : undefined
    return {
      severity: 'error',
      message: '背景色が不適切',
      messageDetails: suggestion
        ? `塗りを${formatRoles(suggestion.targetRoles)}に変更してください。`
        : '塗りには"on"という名前が含まれるバリアブルを設定しないでください。',
      suggestion,
    }
  }

  return null
}
