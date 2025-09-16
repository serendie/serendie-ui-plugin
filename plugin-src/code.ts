import { extractNodeColors } from './extractColors'
import { validateAll as validateColorPairing } from './rules/colorPairing'
import { validateAll as validateAssignTextVariable } from './rules/assignTextVariable'
import { validateAll as validateAssignFrameVariable } from './rules/assignFrameVariable'
import { Result, Issue } from '../shared-src/models/Rules'

figma.showUI(__html__, {
  width: 400,
  height: 640,
  title: 'Serendie Design System Linter',
})

// 選択状態の変更を監視
figma.on('selectionchange', () => {
  const selections = figma.currentPage.selection.filter(
    node =>
      node.type === 'FRAME' ||
      node.type === 'COMPONENT' ||
      node.type === 'INSTANCE'
  )

  const frameNames = selections.map(node => (node as FrameNode).name)

  figma.ui.postMessage({
    type: 'selection-changed',
    frameNames,
  })
})

figma.ui.onmessage = async msg => {
  if (msg.type === 'request-selection') {
    // 初期選択状態のリクエストに応答
    const selections = figma.currentPage.selection.filter(
      node =>
        node.type === 'FRAME' ||
        node.type === 'COMPONENT' ||
        node.type === 'INSTANCE'
    )
    const frameNames = selections.map(node => (node as FrameNode).name)
    figma.ui.postMessage({
      type: 'selection-changed',
      frameNames,
    })
  } else if (msg.type === 'select-node') {
    const node = await figma.getNodeByIdAsync(msg.nodeId)
    if (node && 'type' in node) {
      figma.currentPage.selection = [node as SceneNode]
      figma.viewport.scrollAndZoomIntoView([node as SceneNode])
    }
  } else if (msg.type === 'run-linter') {
    const selections = figma.currentPage.selection.filter(
      node =>
        node.type === 'FRAME' ||
        node.type === 'COMPONENT' ||
        node.type === 'INSTANCE'
    )

    if (selections.length === 0) {
      figma.ui.postMessage({
        type: 'error',
        message: 'フレームを選択してください。',
      })
      return
    }

    try {
      // 各フレームの検証結果を格納する配列
      const frameResults: Array<{
        frameName: string
        frameId: string
        result: Result
        totalNodes: number
      }> = []

      // すべての選択フレームを検証
      for (const selection of selections) {
        const frame = selection as FrameNode
        const nodes = await extractNodeColors(frame)
        const pairingResult = validateColorPairing(nodes)
        const textColorResult = validateAssignTextVariable(nodes)
        const frameColorResult = validateAssignFrameVariable(nodes)
        const allIssues: Issue[] = [
          ...pairingResult.issues,
          ...textColorResult.issues,
          ...frameColorResult.issues,
        ]
        const result: Result = {
          issues: allIssues,
        }

        frameResults.push({
          frameName: frame.name,
          frameId: frame.id,
          result,
          totalNodes: nodes.length,
        })
      }

      figma.ui.postMessage({
        type: 'lint-result',
        frameResults,
      })
    } catch (error) {
      console.error('Linting failed:', error)
      figma.ui.postMessage({
        type: 'error',
        message:
          error instanceof Error ? error.message : 'Unknown error occurred',
      })
    }
  } else if (msg.type === 'close') {
    figma.closePlugin()
  }
}
