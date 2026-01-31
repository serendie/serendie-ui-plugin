export const LIBRARY_NAME = 'Serendie UI Kit'
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
const markLabelSeries = ['01', '02', '03', '04', '05', '06', '07', '08', '09']
const onMarkLabelSeries = ['onMarkLabel', 'inverseOnMarkLabel']

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
  onMarkLabel: markLabelSeries,
  inverseOnMarkLabel: markLabelSeries,
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
  surface: ['onSurface', 'onSurfaceVariant', ...impressionBasicColors],
  inverseSurface: ['inverseOnSurface', ...impressionBasicColors],
  surfaceContainerLowest: [
    'onSurface',
    'onSurfaceVariant',
    ...impressionBasicColors,
  ],
  surfaceContainerLow: [
    'onSurface',
    'onSurfaceVariant',
    ...impressionBasicColors,
  ],
  surfaceContainer: ['onSurface', 'onSurfaceVariant', ...impressionBasicColors],
  surfaceContainerHigh: [
    'onSurface',
    'onSurfaceVariant',
    ...impressionBasicColors,
  ],
  surfaceContainerHighest: [
    'onSurface',
    'onSurfaceVariant',
    ...impressionBasicColors,
  ],
  chartSurface: 'onChartSurface',
  '01': onMarkLabelSeries,
  '02': onMarkLabelSeries,
  '03': onMarkLabelSeries,
  '04': onMarkLabelSeries,
  '05': onMarkLabelSeries,
  '06': onMarkLabelSeries,
  '07': onMarkLabelSeries,
  '08': onMarkLabelSeries,
  '09': onMarkLabelSeries,
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
  severity: 'error' | 'warning' | 'resolved'
  message: string
  messageDetails: string | null
}

type BaseIssue = {
  nodeId: string
  nodeName: string
  nodeType: string
} & IssueDetail

export type DesignTokenSuggestion = {
  targetRoles: string[]
  targetProperty: 'textColor' | 'backgroundColor'
}

export type RuleResult = IssueDetail & {
  suggestion?: DesignTokenSuggestion
}

export type DesignTokenIssue = BaseIssue & {
  source: 'design-token'
  suggestion?: DesignTokenSuggestion
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

export function formatRoles(roles: string | string[] | undefined): string {
  if (!roles) return UNEXPECTED
  if (typeof roles === 'string') return roles
  if (roles.length === 1) return `「roles[0]」`
  if (roles.length === 2) return `「${roles[0]}」または「${roles[1]}」`
  return `${roles.map(role => `「${role}」`).join('')}のいずれか`
}

export function serializeIssues(issue: Issue): string {
  return (
    [
      `${issue.severity}: ${issue.message}`,
      `提案: ${issue.messageDetails}`,
    ].join('\n') + '\n'
  )
}
