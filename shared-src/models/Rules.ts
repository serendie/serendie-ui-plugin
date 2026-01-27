export const LIBRARY_NAME = '🛠️ Serendie UI Kit'
export const COLLECTION_NAME_LIST = [
  'color-reference',
  'dimension-reference',
  'typography-reference',
  'color-system',
  'dimension-system',
  'typography-system',
]
export const UNEXPECTED = 'Unexpected'
export const FRAME_TYPES = [
  'FRAME',
  'RECTANGLE',
  'COMPONENT',
  'INSTANCE',
] as const
export type FrameType = (typeof FRAME_TYPES)[number]
const surfaceSeries = [
  'surface',
  'surfaceContainerLowest',
  'surfaceContainerLow',
  'surfaceContainer',
  'surfaceContainerHigh',
  'surfaceContainerHighest',
]
const impressionBasicColors = [
  'primary',
  'secondary',
  'tertiary',
  'notice',
  'negative',
  'positive',
]
export const TEXT_COLOR_PAIRS: Record<string, string | string[]> = {
  primary: surfaceSeries,
  onPrimary: 'primary',
  onPrimaryContainer: 'primaryContainer',
  secondary: surfaceSeries,
  onSecondary: 'secondary',
  onSecondaryContainer: 'secondaryContainer',
  tertiary: surfaceSeries,
  onTertiary: 'tertiary',
  onTertiaryContainer: 'tertiaryContainer',
  notice: surfaceSeries,
  onNotice: 'notice',
  onNoticeContainer: 'noticeContainer',
  onNoticeContainerVariant: 'noticeContainerVariant',
  negative: surfaceSeries,
  onNegative: 'negative',
  onNegativeContainer: 'negativeContainer',
  onNegativeContainerVariant: 'negativeContainerVariant',
  positive: surfaceSeries,
  onPositive: 'positive',
  onPositiveContainer: 'positiveContainer',
  onPositiveContainerVariant: 'positiveContainerVariant',
  onSurface: surfaceSeries,
  inverseOnSurface: 'inverseSurface',
  onChartSurface: 'chartSurface',
  onMarkLabel: ['01', '02', '03', '04', '05', '06', '07', '08', '09'],
  inverseOnMarkLabel: ['01', '02', '03', '04', '05', '06', '07', '08', '09'],
}

export const BACKGROUND_COLOR_PAIRS: Record<string, string | string[]> = {
  primary: ['onPrimary'],
  primaryContainer: 'onPrimaryContainer',
  secondary: 'onSecondary',
  secondaryContainer: 'onSecondaryContainer',
  tertiary: 'onTertiary',
  tertiaryContainer: 'onTertiaryContainer',
  notice: 'onNotice',
  noticeContainer: 'onNoticeContainer',
  noticeContainerVariant: 'onNoticeContainerVariant',
  negative: 'onNegative',
  negativeContainer: 'onNegativeContainer',
  negativeContainerVariant: 'onNegativeContainerVariant',
  positive: 'onPositive',
  positiveContainer: 'onPositiveContainer',
  positiveContainerVariant: 'onPositiveContainerVariant',
  surface: [...impressionBasicColors, 'onSurface', 'onSurfaceVariant'],
  inverseSurface: [...impressionBasicColors, 'inverseOnSurface'],
  surfaceContainerLowest: [
    ...impressionBasicColors,
    'onSurface',
    'onSurfaceVariant',
  ],
  surfaceContainerLow: [
    ...impressionBasicColors,
    'onSurface',
    'onSurfaceVariant',
  ],
  surfaceContainer: [...impressionBasicColors, 'onSurface', 'onSurfaceVariant'],
  surfaceContainerHigh: [
    ...impressionBasicColors,
    'onSurface',
    'onSurfaceVariant',
  ],
  surfaceContainerHighest: [
    ...impressionBasicColors,
    'onSurface',
    'onSurfaceVariant',
  ],
  chartSurface: 'onChartSurface',
  '01': ['onMarkLabel', 'inverseOnMarkLabel'],
  '02': ['onMarkLabel', 'inverseOnMarkLabel'],
  '03': ['onMarkLabel', 'inverseOnMarkLabel'],
  '04': ['onMarkLabel', 'inverseOnMarkLabel'],
  '05': ['onMarkLabel', 'inverseOnMarkLabel'],
  '06': ['onMarkLabel', 'inverseOnMarkLabel'],
  '07': ['onMarkLabel', 'inverseOnMarkLabel'],
  '08': ['onMarkLabel', 'inverseOnMarkLabel'],
  '09': ['onMarkLabel', 'inverseOnMarkLabel'],
}

export const COLOR_ROLES: string[] = Array.from(
  new Set([
    ...Object.keys(TEXT_COLOR_PAIRS),
    ...Object.keys(BACKGROUND_COLOR_PAIRS),
    'onSurfaceVariant',
    'inversePrimary',
    'outline',
    'outlineVariant',
    'scrim',
    'disabled',
    'disabledOnSurface',
    'selected',
    'selectedSurface',
    'hovered',
    'hoveredVariant',
    'hoveredOnPrimary',
    'scalemark',
    'threshold',
  ])
)

export type IssueDetail = {
  severity: 'error' | 'warning'
  message: string
  messageDetails: string | null
}

type BaseIssue = {
  nodeId: string
  nodeName: string
  nodeType: string
} & IssueDetail

export type DesignTokenIssue = BaseIssue & {
  source: 'design-token'
}

export type ComponentSuggestion = {
  componentName: string
  properties?: Record<string, string | boolean | number>
}

export type ComponentIssue = BaseIssue & {
  source: 'component'
  suggestion: ComponentSuggestion
}

export type Issue = DesignTokenIssue | ComponentIssue

export function serializeIssues(issue: Issue): string {
  return (
    [`${issue.severity}: ${issue.message}`, `提案: ${issue.messageDetails}`].join(
      '\n'
    ) + '\n'
  )
}
