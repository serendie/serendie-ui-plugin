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

figma.ui.onmessage = async msg => {
  if (msg.type === 'select-node') {
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

    const selection = selections[0] as FrameNode

    try {
      const nodes = await extractNodeColors(selection)
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

      figma.ui.postMessage({
        type: 'lint-result',
        result,
        totalNodes: nodes.length,
        frameName: selection.name,
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
