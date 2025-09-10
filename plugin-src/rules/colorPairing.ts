import { IssueDetail, Issue, Result } from '../../shared-src/models/Rules'

/**
 * Color contrast validation rules based on Serendie Design System
 */

// Mapping of text colors to their valid background colors
const COLOR_RULES: Record<string, string> = {
  // Primary colors
  primary: 'onPrimary',
  onPrimary: 'primary',
  primaryContainer: 'onPrimaryContainer',
  onPrimaryContainer: 'primaryContainer',

  // Secondary colors
  secondary: 'onSecondary',
  onSecondary: 'secondary',
  secondaryContainer: 'onSecondaryContainer',
  onSecondaryContainer: 'secondaryContainer',

  // Tertiary colors
  tertiary: 'onTertiary',
  onTertiary: 'tertiary',
  tertiaryContainer: 'onTertiaryContainer',
  onTertiaryContainer: 'tertiaryContainer',

  // Surface colors
  surface: 'onSurface',
  onSurface: 'surface',
  surfaceVariant: 'onSurfaceVariant',
  onSurfaceVariant: 'surfaceVariant',
  surfaceContainerLowest: 'onSurface',
  surfaceContainerLow: 'onSurface',
  surfaceContainer: 'onSurface',
  surfaceContainerHigh: 'onSurface',
  surfaceContainerHighest: 'onSurface',

  // Error colors
  error: 'onError',
  onError: 'error',
  errorContainer: 'onErrorContainer',
  onErrorContainer: 'errorContainer',

  // Neutral colors
  outline: 'surface',
  outlineVariant: 'surface',

  // Special mappings
  noticeContainer: 'onNoticeContainer',
  onNoticeContainer: 'noticeContainer',
}

function extractColorRole(variableName: string): string | null {
  const parts = variableName.split('/')
  const lastPart = parts[parts.length - 1]

  // Check if this is a known color role
  if (lastPart in COLOR_RULES) {
    return lastPart
  }

  // Try to find color role in the full path
  for (const part of parts) {
    if (part in COLOR_RULES) {
      return part
    }
  }

  return null
}

function getColorName(colorPath: string): string {
  if (colorPath === 'Unknown') {
    return '不明'
  }
  const parts = colorPath.split('/')
  return parts[parts.length - 1] || colorPath
}

export function validate(
  textColor: string,
  backgroundColor: string
): IssueDetail | null {
  if (textColor === 'Unknown' || backgroundColor === 'Unknown') {
    return null
  }

  const textRole = extractColorRole(textColor)
  const bgRole = extractColorRole(backgroundColor)
  const textName = getColorName(textColor)
  const bgName = getColorName(backgroundColor)

  if (!textRole || !bgRole) {
    return {
      severity: 'warning',
      message: 'カラーロールを識別できません',
      suggestion: `「${textName}」と「${bgName}」の組み合わせは検証できません`,
    }
  }

  // Check if the relationship is valid
  const expectedBg = COLOR_RULES[textRole]
  const expectedText = COLOR_RULES[bgRole]

  const isValidRelationship = bgRole === expectedBg || textRole === expectedText

  if (!isValidRelationship) {
    return {
      severity: 'error',
      message: 'テキスト色と背景色の組み合わせ',
      suggestion: `テキスト色を${expectedText}にするか、背景色を${expectedBg}に変更してください（現在: テキスト=${textName}、背景=${bgName}）`,
    }
  }

  return null
}

export function validateAll(
  colorPairs: Array<{
    nodeId: string
    nodeName: string
    nodeType: string
    textColor: string
    backgroundColor: string
  }>
): Result {
  const issues: Issue[] = []

  for (const pair of colorPairs) {
    const issueDetail = validate(pair.textColor, pair.backgroundColor)
    if (issueDetail) {
      issues.push({
        nodeId: pair.nodeId,
        nodeName: pair.nodeName,
        nodeType: pair.nodeType,
        ...issueDetail,
      })
    }
  }

  return {
    totalIssues: issues.length,
    issues,
  }
}
