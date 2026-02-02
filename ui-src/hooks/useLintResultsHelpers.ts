import {
  DesignTokenIssue,
  DesignTokenTargetProperty,
  Issue,
} from '../../shared-src/models/Rules'
import {
  TokenFixResult,
  BorderTokenFixTarget,
} from '../../shared-src/models/PluginMessage'

type BorderTargetProperty = BorderTokenFixTarget['targetProperty']

const COLOR_PROPERTIES: ReadonlySet<DesignTokenTargetProperty> = new Set([
  'textColor',
  'backgroundColor',
])

const BORDER_PROPERTIES: ReadonlySet<DesignTokenTargetProperty> = new Set([
  'strokeColor',
  'strokeWeight',
  'cornerRadius',
])

export function isColorProperty(tp: DesignTokenTargetProperty): boolean {
  return COLOR_PROPERTIES.has(tp)
}

export function isBorderProperty(tp: DesignTokenTargetProperty): boolean {
  return BORDER_PROPERTIES.has(tp)
}

export function isColorTokenIssue(issue: Issue): issue is DesignTokenIssue {
  return (
    issue.source === 'design-token' && isColorProperty(issue.targetProperty)
  )
}

export function isBorderTokenIssue(issue: Issue): issue is DesignTokenIssue {
  return (
    issue.source === 'design-token' && isBorderProperty(issue.targetProperty)
  )
}

function extractRoleName(fullPath: string): string {
  return fullPath.split('/').pop() ?? fullPath
}

function toRoleList(appliedRole: string | string[] | undefined): string[] {
  if (!appliedRole) return []
  return Array.isArray(appliedRole) ? appliedRole : [appliedRole]
}

export function formatColorResolvedMessage(applied: TokenFixResult[]): {
  message: string
  messageDetails: string | null
} {
  const first = applied[0]
  if (!first) return { message: '修正しました', messageDetails: null }
  return {
    message:
      first.isFallback && first.appliedRole
        ? `近似色の「${first.appliedRole}」を適用`
        : first.appliedRole
          ? `${first.appliedRole}を適用しました`
          : '修正しました',
    messageDetails:
      first.isFallback && first.originalColorHex
        ? `元の色: ${first.originalColorHex}`
        : null,
  }
}

const BORDER_LABEL_MAP: Record<BorderTargetProperty, string> = {
  strokeWeight: '線幅',
  cornerRadius: '角丸',
  strokeColor: '線色',
}

export function formatBorderResolvedMessage(
  targetProperty: BorderTargetProperty,
  appliedResults: TokenFixResult[]
): { message: string; messageDetails: string | null } {
  const label = BORDER_LABEL_MAP[targetProperty]

  const matched = appliedResults.find(
    r => r.targetProperty === targetProperty && r.appliedRole
  )

  if (!matched?.appliedRole)
    return { message: '修正しました', messageDetails: null }

  const uniqueRoles = [
    ...new Set(toRoleList(matched.appliedRole).map(extractRoleName)),
  ]
  const rolesText = uniqueRoles.map(r => `「${r}」`).join('')
  return {
    message: `${label}に${rolesText}を適用しました`,
    messageDetails: null,
  }
}

export function buildSuccessResultMap(
  results: TokenFixResult[]
): Map<string, TokenFixResult[]> {
  const map = new Map<string, TokenFixResult[]>()
  for (const r of results) {
    if (r.status !== 'success') continue
    const list = map.get(r.nodeId) ?? []
    list.push(r)
    map.set(r.nodeId, list)
  }
  return map
}

/**
 * トークン修正結果を issues にマージする共通関数。
 * 対象カテゴリの issue のみ更新し、他カテゴリの issue はそのまま保持する。
 */
export function mergeTokenFixResults(
  currentIssues: Issue[],
  postFixIssues: Issue[],
  successResultMap: Map<string, TokenFixResult[]>,
  isTargetIssue: (issue: Issue) => boolean,
  formatResolved: (
    issue: Issue,
    applied: TokenFixResult[]
  ) => { message: string; messageDetails: string | null }
): Issue[] {
  // 対象外の issue はそのまま保持
  const untouchedIssues = currentIssues.filter(i => !isTargetIssue(i))

  // 対象カテゴリの未解決 issue は postFixIssues から取得
  const newUnresolvedIssues = postFixIssues.filter(i => isTargetIssue(i))

  // 対象カテゴリで修正成功 & postFixIssues に残っていない → resolved
  const unresolvedNodeIds = new Set(newUnresolvedIssues.map(i => i.nodeId))
  const resolvedIssues = currentIssues
    .filter(
      i =>
        isTargetIssue(i) &&
        successResultMap.has(i.nodeId) &&
        !unresolvedNodeIds.has(i.nodeId)
    )
    .map(issue => {
      const applied = successResultMap.get(issue.nodeId) ?? []
      const { message, messageDetails } = formatResolved(issue, applied)
      return {
        ...issue,
        severity: 'resolved' as const,
        message,
        messageDetails,
      }
    })

  return [...untouchedIssues, ...resolvedIssues, ...newUnresolvedIssues]
}
