import { IssueDetail, Issue, Result } from '../../shared-src/models/Rules'

/**
 * フレームノードのカラー変数使用を検証
 */

export function validate(backgroundColor: string): IssueDetail | null {
  if (backgroundColor === 'Unknown') {
    return {
      severity: 'warning',
      message: '背景のカラー変数が未設定',
      suggestion: '背景にデザインシステムのカラー変数を設定してください',
    }
  }

  return null
}

export function validateAll(
  nodes: Array<{
    nodeId: string
    nodeName: string
    nodeType: string
    textColor: string
    backgroundColor: string
  }>
): Result {
  const issues: Issue[] = []

  const frameTypes = ['FRAME', 'RECTANGLE', 'COMPONENT', 'INSTANCE']

  for (const node of nodes) {
    // フレーム系ノードのみチェック
    if (!frameTypes.includes(node.nodeType)) continue

    // 背景色がNone（色なし）の場合はスキップ
    if (node.backgroundColor === 'None') continue

    const issueDetail = validate(node.backgroundColor)
    if (issueDetail) {
      issues.push({
        nodeId: node.nodeId,
        nodeName: node.nodeName,
        nodeType: node.nodeType,
        ...issueDetail,
      })
    }
  }

  return {
    issues,
  }
}
