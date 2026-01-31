import {
  RuleResult,
  BACKGROUND_COLOR_PAIRS,
  DesignTokenSuggestion,
} from '../../../shared-src/models/Rules'
import extractColorRole from '../core/extractColorRole'

function computeSuggestion(
  backgroundColor: string
): DesignTokenSuggestion | undefined {
  const bgRole = extractColorRole(backgroundColor)
  if (!bgRole || !(bgRole in BACKGROUND_COLOR_PAIRS)) return undefined
  const candidates = BACKGROUND_COLOR_PAIRS[bgRole]
  const targetRole = typeof candidates === 'string' ? candidates : candidates[0]
  if (!targetRole) return undefined
  return { targetRole, targetProperty: 'textColor' }
}

export default function validate(
  textColor: string | null,
  backgroundColor?: string | null
): RuleResult | null {
  if (!textColor || textColor.match(/^sd\/reference/)) {
    return null
  }

  const textRole = extractColorRole(textColor)
  if (!textRole) {
    const suggestion = backgroundColor
      ? computeSuggestion(backgroundColor)
      : undefined
    return {
      severity: 'warning',
      message: 'テキスト色にシステムトークンを未使用',
      messageDetails: '塗りにデザインシステムのバリアブルを設定してください。',
      suggestion,
    }
  }

  if (
    [
      'primary',
      'secondary',
      'tertiary',
      'notice',
      'negative',
      'positive',
    ].includes(textRole)
  ) {
    return null
  }

  if (!textRole.match(/^on/) && !textRole.match(/^\w+On[A-Z]/)) {
    const suggestion = backgroundColor
      ? computeSuggestion(backgroundColor)
      : undefined
    return {
      severity: 'error',
      message: 'テキスト色が不適切',
      messageDetails:
        '塗りには"on"という名前が含まれるデザインシステムのバリアブルを設定してください。',
      suggestion,
    }
  }

  return null
}
