import extractColorInfo from './utils/extractColorInfo'
import { Issue } from '../shared-src/models/Rules'
import validateColorPairing from './utils/validateColorPairing'
import validateAssignFrameVariable from './utils/validateAssignFrameVariable'
import validateAssignTextVariable from './utils/validateAssignTextVariable'

figma.showUI(__html__, {
  width: 400,
  height: 640,
  title: 'Serendie Design System Linter',
})

figma.on('selectionchange', () => {
  const selections = figma.currentPage.selection.filter(
    node =>
      node.type === 'FRAME' ||
      node.type === 'COMPONENT' ||
      node.type === 'INSTANCE'
  )
  figma.ui.postMessage({
    type: 'selection-changed',
    selectionIds: selections.map(node => (node as FrameNode).id),
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
    figma.ui.postMessage({
      type: 'selection-changed',
      selectionIds: selections.map(node => (node as FrameNode).id),
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
      const results: Array<{
        name: string
        id: string
        issues: Issue[]
        totalNodes: number
      }> = []
      for (const selection of selections) {
        const colorInfoList = await extractColorInfo(selection)
        const pairingResult = validateColorPairing(colorInfoList)
        const textColorResult = validateAssignTextVariable(colorInfoList)
        const frameColorResult = validateAssignFrameVariable(colorInfoList)
        const issues: Issue[] = [
          ...pairingResult.issues,
          ...textColorResult.issues,
          ...frameColorResult.issues,
        ]

        results.push({
          name: selection.name,
          id: selection.id,
          issues,
          totalNodes: colorInfoList.length,
        })
      }

      figma.ui.postMessage({
        type: 'lint-result',
        results,
      })
    } catch (error) {
      figma.ui.postMessage({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : '未知のエラーが発生しました。',
      })
    }
  } else if (msg.type === 'close') {
    figma.closePlugin()
  }
}
