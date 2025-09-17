import { IssueDetail, Issue } from '../../shared-src/models/Rules'
import { MANUAL_VALUE } from '../utils/extractColors'

export function validate(textColor: string | null): IssueDetail | null {
  if (textColor === MANUAL_VALUE) {
    return {
      severity: 'warning',
      message: 'テキスト色がバリアブル以外',
      suggestion: '塗りにデザインシステムのバリアブルを設定してください。',
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
): { issues: Issue[] } {
  const issues: Issue[] = []

  for (const node of nodes) {
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
