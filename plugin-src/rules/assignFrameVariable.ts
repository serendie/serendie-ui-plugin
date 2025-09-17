import { IssueDetail, Issue } from '../../shared-src/models/Rules'
import { MANUAL_VALUE } from '../utils/extractColors'

export function validate(backgroundColor: string | null): IssueDetail | null {
  if (backgroundColor === MANUAL_VALUE) {
    return {
      severity: 'warning',
      message: '背景色がバリアブル以外',
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
