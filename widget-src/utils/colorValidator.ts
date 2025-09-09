import { LintResultType, ColorIssueType } from '../schema/Lint'

// Strict color relationship rules
const COLOR_RULES: Record<string, string> = {
  // Primary colors
  'primary': 'onPrimary',
  'onPrimary': 'primary',
  'primaryContainer': 'onPrimaryContainer',
  'onPrimaryContainer': 'primaryContainer',
  
  // Secondary colors
  'secondary': 'onSecondary',
  'onSecondary': 'secondary',
  'secondaryContainer': 'onSecondaryContainer',
  'onSecondaryContainer': 'secondaryContainer',
  
  // Tertiary colors
  'tertiary': 'onTertiary',
  'onTertiary': 'tertiary',
  'tertiaryContainer': 'onTertiaryContainer',
  'onTertiaryContainer': 'tertiaryContainer',
  
  // Surface colors
  'surface': 'onSurface',
  'onSurface': 'surface',
  'surfaceVariant': 'onSurfaceVariant',
  'onSurfaceVariant': 'surfaceVariant',
  
  // Positive colors
  'positive': 'onPositive',
  'onPositive': 'positive',
  'positiveContainer': 'onPositiveContainer',
  'onPositiveContainer': 'positiveContainer',
  
  // Negative colors
  'negative': 'onNegative',
  'onNegative': 'negative',
  'negativeContainer': 'onNegativeContainer',
  'onNegativeContainer': 'negativeContainer',
  
  // Notice colors
  'notice': 'onNotice',
  'onNotice': 'notice',
  'noticeContainer': 'onNoticeContainer',
  'onNoticeContainer': 'noticeContainer',
}

function extractColorRole(variableName: string): string | null {
  // Extract the color role from variable name
  // e.g., "color/primary" -> "primary"
  // e.g., "system/color/onPrimary" -> "onPrimary"
  
  const parts = variableName.split('/')
  const lastPart = parts[parts.length - 1]
  
  // Check if this is a known color role
  if (COLOR_RULES.hasOwnProperty(lastPart)) {
    return lastPart
  }
  
  // Try to find color role in the full path
  for (const part of parts) {
    if (COLOR_RULES.hasOwnProperty(part)) {
      return part
    }
  }
  
  return null
}

export function validateColorRelationship(
  textColorVariable: string,
  backgroundColorVariable: string
): {
  isValid: boolean
  expectedTextColor: string | null
  message: string
} {
  const textRole = extractColorRole(textColorVariable)
  const bgRole = extractColorRole(backgroundColorVariable)
  
  // If we can't identify the roles, we can't validate
  if (!textRole || !bgRole) {
    return {
      isValid: true, // Assume valid if we can't determine roles
      expectedTextColor: null,
      message: 'Color roles could not be determined from variable names',
    }
  }
  
  // Check if the relationship is correct
  const expectedTextRole = COLOR_RULES[bgRole]
  
  if (!expectedTextRole) {
    return {
      isValid: true, // No rule for this background
      expectedTextColor: null,
      message: `No specific rule for background color "${bgRole}"`,
    }
  }
  
  const isValid = textRole === expectedTextRole
  
  return {
    isValid,
    expectedTextColor: isValid ? null : expectedTextRole,
    message: isValid 
      ? `Correct: "${textRole}" on "${bgRole}"`
      : `Incorrect: Expected "${expectedTextRole}" on "${bgRole}", but found "${textRole}"`,
  }
}

export function validateWithRules(
  colorPairs: Array<{
    nodeId: string
    nodeName: string
    textColor: string
    backgroundColor: string
  }>
): LintResultType {
  const issues: ColorIssueType[] = []
  
  for (const pair of colorPairs) {
    const validation = validateColorRelationship(
      pair.textColor,
      pair.backgroundColor
    )
    
    if (!validation.isValid && validation.expectedTextColor) {
      issues.push({
        nodeId: pair.nodeId,
        nodeName: pair.nodeName,
        textColor: pair.textColor,
        backgroundColor: pair.backgroundColor,
        severity: 'error',
        message: validation.message,
        suggestion: `Change text color to "${validation.expectedTextColor}" or a variable containing it`,
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