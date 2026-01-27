import { Issue, FRAME_TYPES } from '../../shared-src/models/Rules'
import { ColorInfo } from './extractColorInfo'
import validate from '../rules/assignFrameVariable'

export default function validateAssignFrameVariable(nodes: ColorInfo[]): {
  issues: Issue[]
} {
  const issues: Issue[] = []

  for (const node of nodes) {
    // フレーム系ノードのみチェック
    if (!FRAME_TYPES.includes(node.nodeType as (typeof FRAME_TYPES)[number]))
      continue

    // 背景色がNone（色なし）の場合はスキップ
    if (node.backgroundColor === 'None') continue

    const issueDetail = validate(node.backgroundColor)
    if (issueDetail) {
      issues.push({
        nodeId: node.nodeId,
        nodeName: node.nodeName,
        nodeType: node.nodeType,
        source: 'design-token',
        ...issueDetail,
      })
    }
  }

  return {
    issues,
  }
}
