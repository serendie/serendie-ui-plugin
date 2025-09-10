import { IssueDetail, Issue, Result } from '../../shared-src/models/Rules'

/**
 * テキストノードのカラー変数使用を検証
 */

export function validate(textColor: string): IssueDetail | null {
  if (textColor === 'Unknown') {
    return {
      severity: 'warning',
      message: 'テキストのカラー変数が未設定',
      suggestion: 'テキストにデザインシステムのカラー変数を設定してください',
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

  for (const node of nodes) {
    // テキストノードのみチェック
    if (node.nodeType !== 'TEXT') continue

    const issueDetail = validate(node.textColor)
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
