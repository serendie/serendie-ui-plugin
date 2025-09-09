import { z } from 'zod'

export const ColorIssue = z.object({
  nodeId: z.string().describe('The ID of the node with the issue'),
  nodeName: z.string().describe('The name of the node'),
  textColor: z.string().describe('Current text color variable name'),
  backgroundColor: z.string().describe('Current background color variable name'),
  severity: z.enum(['error', 'warning', 'info']),
  message: z.string().describe('Issue description'),
  suggestion: z.string().describe('Suggested fix'),
})

export const LintResult = z.object({
  isValid: z.boolean().describe('Whether all color relationships are valid'),
  totalIssues: z.number().describe('Total number of issues found'),
  issues: z.array(ColorIssue).describe('List of color relationship issues'),
  summary: z.string().describe('Summary of the lint results'),
})

export type LintResultType = z.infer<typeof LintResult>
export type ColorIssueType = z.infer<typeof ColorIssue>

export const COLOR_PAIRS = {
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
  surface: 'onSurface',
  onSurface: 'surface',
  surfaceVariant: 'onSurfaceVariant',
  onSurfaceVariant: 'surfaceVariant',
  positive: 'onPositive',
  onPositive: 'positive',
  positiveContainer: 'onPositiveContainer',
  onPositiveContainer: 'positiveContainer',
  negative: 'onNegative',
  onNegative: 'negative',
  negativeContainer: 'onNegativeContainer',
  onNegativeContainer: 'negativeContainer',
  notice: 'onNotice',
  onNotice: 'notice',
  noticeContainer: 'onNoticeContainer',
  onNoticeContainer: 'noticeContainer',
}

export function getCorrectTextColor(backgroundColor: string): string | null {
  const normalizedBg = backgroundColor.toLowerCase()
  
  for (const [bg, text] of Object.entries(COLOR_PAIRS)) {
    if (normalizedBg.includes(bg.toLowerCase())) {
      return text
    }
  }
  
  return null
}

export function isValidColorPair(textColor: string, backgroundColor: string): boolean {
  const normalizedText = textColor.toLowerCase()
  const normalizedBg = backgroundColor.toLowerCase()
  
  for (const [bg, expectedText] of Object.entries(COLOR_PAIRS)) {
    if (normalizedBg.includes(bg.toLowerCase())) {
      return normalizedText.includes(expectedText.toLowerCase())
    }
  }
  
  return false
}