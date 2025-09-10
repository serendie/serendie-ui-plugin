import {
  ColorIssue,
  ColorValidationIssue,
  ColorValidationResult,
} from '../../shared-src/models/ColorValidation'

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

interface ColorPair {
  nodeId: string
  nodeName: string
  textColor: string
  backgroundColor: string
}

/**
 * Extract color role from variable name
 */
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

/**
 * Validate color relationship based on design system rules
 */
export function validateColorContrast(
  textColorVariable: string,
  backgroundColorVariable: string
): ColorIssue | null {
  const textRole = extractColorRole(textColorVariable)
  const bgRole = extractColorRole(backgroundColorVariable)

  // If we can't identify the roles, we can't validate
  if (!textRole || !bgRole) {
    return {
      severity: 'warning',
      message: 'Unable to validate color relationship',
      suggestion: 'Ensure both colors are from the design system variables',
    }
  }

  // Check if the relationship is valid
  const expectedBg = COLOR_RULES[textRole]
  const expectedText = COLOR_RULES[bgRole]

  const isValidRelationship = bgRole === expectedBg || textRole === expectedText

  if (!isValidRelationship) {
    return {
      severity: 'error',
      message: `Invalid color pairing: ${textRole} on ${bgRole}`,
      suggestion: `Use "${textRole}" with "${expectedBg}" background, or "${expectedText}" text on "${bgRole}" background`,
    }
  }

  return null // Valid relationship
}

/**
 * Validate all color pairs and return issues
 */
export function validateColorPairs(
  colorPairs: ColorPair[]
): ColorValidationResult {
  const issues: ColorValidationIssue[] = []

  for (const pair of colorPairs) {
    const issue = validateColorContrast(pair.textColor, pair.backgroundColor)
    if (issue) {
      issues.push({
        nodeId: pair.nodeId,
        nodeName: pair.nodeName,
        textColor: pair.textColor,
        backgroundColor: pair.backgroundColor,
        ...issue,
      })
    }
  }

  const isValid = issues.length === 0

  return {
    isValid,
    totalIssues: issues.length,
    issues,
    summary: isValid
      ? `✅ All ${colorPairs.length} text nodes have valid color relationships`
      : `⚠️ Found ${issues.length} color relationship issues out of ${colorPairs.length} text nodes`,
  }
}
