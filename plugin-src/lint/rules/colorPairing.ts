import {
  TEXT_COLOR_PAIRS,
  BACKGROUND_COLOR_PAIRS,
  RuleResult,
  DesignTokenSuggestion,
  UNEXPECTED,
  formatRoles,
} from '../../../shared-src/models/Rules'
import extractColorRole from '../core/extractColorRole'

function isValid(
  expected: string | string[] | undefined,
  actual: string
): boolean {
  if (!expected) return false
  if (typeof expected === 'string') {
    return actual === expected
  }
  return expected.includes(actual)
}

function computeSuggestion(
  backgroundColor: string
): DesignTokenSuggestion | undefined {
  const bgRole = extractColorRole(backgroundColor)
  if (!bgRole || !(bgRole in BACKGROUND_COLOR_PAIRS)) return undefined
  const candidates = BACKGROUND_COLOR_PAIRS[bgRole]
  const targetRoles = typeof candidates === 'string' ? [candidates] : candidates
  if (targetRoles.length === 0) return undefined
  return { targetRoles, targetProperty: 'textColor' }
}

export default function validate(
  textColor: string | null,
  backgroundColor: string | null
): RuleResult | null {
  if (
    !textColor ||
    !backgroundColor ||
    textColor === UNEXPECTED ||
    backgroundColor === UNEXPECTED
  ) {
    return null
  }

  const textRole = extractColorRole(textColor)
  const bgRole = extractColorRole(backgroundColor)

  if (
    !textRole ||
    !bgRole ||
    !(textRole in TEXT_COLOR_PAIRS) ||
    !(bgRole in BACKGROUND_COLOR_PAIRS)
  ) {
    return null
  }

  if (
    !isValid(TEXT_COLOR_PAIRS[textRole], bgRole) ||
    !isValid(BACKGROUND_COLOR_PAIRS[bgRole], textRole)
  ) {
    return {
      severity: 'error',
      message: 'テキスト色または背景色が不適切',
      messageDetails: `テキスト色を${formatRoles(BACKGROUND_COLOR_PAIRS[bgRole])}に変更、または背景色を${formatRoles(TEXT_COLOR_PAIRS[textRole])}に変更してください。`,
      suggestion: computeSuggestion(backgroundColor),
    }
  }

  return null
}
