import {
  COLOR_PAIRS,
  IssueDetail,
  UNEXPECTED,
} from '../../shared-src/models/Rules'
import extractColorRole from '../core/extractColorRole'

function formatRoles(roles: string | string[] | undefined): string {
  if (!roles) return UNEXPECTED
  if (typeof roles === 'string') return roles
  if (roles.length === 1) return roles[0]
  if (roles.length === 2) return `${roles[0]}または${roles[1]}`
  return roles.slice(0, -1).join('、') + `または${roles[roles.length - 1]}`
}

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

export default function validate(
  textColor: string | null,
  backgroundColor: string | null
): IssueDetail | null {
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
    !(textRole in COLOR_PAIRS) ||
    !(bgRole in COLOR_PAIRS)
  ) {
    return null
  }

  if (
    !isValid(COLOR_PAIRS[textRole], bgRole) ||
    !isValid(COLOR_PAIRS[bgRole], textRole)
  ) {
    return {
      severity: 'error',
      message: 'テキスト色または背景色が不適切',
      suggestion: `テキスト色を${formatRoles(COLOR_PAIRS[bgRole])}に変更、または背景色を${formatRoles(COLOR_PAIRS[textRole])}に変更してください。`,
    }
  }

  return null
}
