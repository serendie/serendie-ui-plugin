import { IssueDetail, MANUAL_VALUE } from '../../shared-src/models/Rules'

const COLOR_RULES: Record<string, string | string[]> = {
  primary: 'onPrimary',
  onPrimary: 'primary',
  primaryContainer: 'onPrimaryContainer',
  onPrimaryContainer: 'primaryContainer',
  secondary: 'onSecondary',
  onSecondary: 'secondary',
  secondaryContainer: 'onSecondaryContainer',
  onSecondaryContainer: 'secondaryContainer',
  tertiary: 'onTertiary',
  onTertiary: 'tertiary',
  tertiaryContainer: 'onTertiaryContainer',
  onTertiaryContainer: 'tertiaryContainer',
  surface: ['onSurface', 'onSurfaceVariant'],
  onSurface: [
    'surface',
    'surfaceContainerLowest',
    'surfaceContainerLow',
    'surfaceContainer',
    'surfaceContainerHigh',
    'surfaceContainerHighest',
  ],
  onSurfaceVariant: [
    'surface',
    'surfaceContainerLowest',
    'surfaceContainerLow',
    'surfaceContainer',
    'surfaceContainerHigh',
    'surfaceContainerHighest',
  ],
  surfaceContainerLowest: ['onSurface', 'onSurfaceVariant'],
  surfaceContainerLow: ['onSurface', 'onSurfaceVariant'],
  surfaceContainer: ['onSurface', 'onSurfaceVariant'],
  surfaceContainerHigh: ['onSurface', 'onSurfaceVariant'],
  surfaceContainerHighest: ['onSurface', 'onSurfaceVariant'],
  error: 'onError',
  onError: 'error',
  errorContainer: 'onErrorContainer',
  onErrorContainer: 'errorContainer',
  outline: 'surface',
  outlineVariant: 'surface',
  noticeContainer: 'onNoticeContainer',
  onNoticeContainer: 'noticeContainer',
}

function extractColorRole(variableName: string): string | null {
  const parts = variableName.split('/')
  const lastPart = parts[parts.length - 1]

  if (lastPart in COLOR_RULES) {
    return lastPart
  }

  for (const part of parts) {
    if (part in COLOR_RULES) {
      return part
    }
  }

  return null
}

export default function validate(
  textColor: string | null,
  backgroundColor: string | null
): IssueDetail | null {
  if (
    !textColor ||
    !backgroundColor ||
    textColor === MANUAL_VALUE ||
    backgroundColor === MANUAL_VALUE
  ) {
    return null
  }

  const textRole = extractColorRole(textColor)
  const bgRole = extractColorRole(backgroundColor)

  if (!textRole || !bgRole) {
    return null
  }

  const expectedBg = COLOR_RULES[textRole]
  const expectedText = COLOR_RULES[bgRole]
  const isValidPairing = (
    expected: string | string[] | undefined,
    actual: string
  ): boolean => {
    if (!expected) return false
    if (typeof expected === 'string') {
      return actual === expected
    }
    return expected.includes(actual)
  }

  const isValidRelationship =
    isValidPairing(expectedBg, bgRole) || isValidPairing(expectedText, textRole)
  if (!isValidRelationship) {
    const formatExpected = (
      expected: string | string[] | undefined
    ): string => {
      if (!expected) return 'Unknown'
      if (typeof expected === 'string') return expected
      if (expected.length === 1) return expected[0]
      if (expected.length === 2) return `${expected[0]}または${expected[1]}`
      return (
        expected.slice(0, -1).join('、') +
        `または${expected[expected.length - 1]}`
      )
    }

    return {
      severity: 'error',
      message: 'テキスト色または背景色が不適切',
      suggestion: `テキスト色を${formatExpected(expectedText)}にするか、背景色を${formatExpected(expectedBg)}に変更してください。`,
    }
  }

  return null
}
