export const LIBRARY_NAME = '🛠️ Serendie UI Kit'
export const UNEXPECTED = 'Unexpected'
export const COLOR_PAIRS: Record<string, string | string[]> = {
  primary: ['onPrimary', 'hoveredOnPrimary'],
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
  surface: ['onSurface', 'onSurfaceVariant', 'disabledOnSurface'],
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
  inverseSurface: 'inverseOnSurface',
  surfaceContainerLowest: ['onSurface', 'onSurfaceVariant'],
  surfaceContainerLow: ['onSurface', 'onSurfaceVariant'],
  surfaceContainer: ['onSurface', 'onSurfaceVariant'],
  surfaceContainerHigh: ['onSurface', 'onSurfaceVariant'],
  surfaceContainerHighest: ['onSurface', 'onSurfaceVariant'],
  error: 'onError',
  onError: 'error',
  errorContainer: 'onErrorContainer',
  onErrorContainer: 'errorContainer',
  noticeContainer: 'onNoticeContainer',
  onNoticeContainer: 'noticeContainer',
  disabledOnSurface: 'surface',
  hoveredOnPrimary: 'primary',
  chartSurface: 'onChartSurface',
  onChartSurface: 'chartSurface',
  onMarkLabel: ['01', '02', '03', '04', '05', '06', '07', '08', '09'],
  inverseOnMarkLabel: ['01', '02', '03', '04', '05', '06', '07', '08', '09'],
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

export const COLOR_ROLES = [
  ...Object.keys(COLOR_PAIRS),
  'inversePrimary',
  'outline',
  'outlineVariant',
  'scrim',
  'disabled',
  'selected',
  'hovered',
  'hoveredVariant',
  'scalemark',
  'threshold',
]

export type IssueDetail = {
  severity: 'error' | 'warning' | 'info'
  message: string
  suggestion: string
}

export type Issue = {
  nodeId: string
  nodeName: string
  nodeType: string
} & IssueDetail
