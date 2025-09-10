import { extractNodeColors } from './extractColors'
import { validateAll as validateColorPairing } from './rules/colorPairing'
import { validateAll as validateAssignTextVariable } from './rules/assignTextVariable'
import { validateAll as validateAssignFrameVariable } from './rules/assignFrameVariable'
import { Result, Issue } from '../shared-src/models/Rules'

figma.showUI(__html__, {
  width: 500,
  height: 600,
  title: 'Spread System Color Linter',
})

figma.ui.onmessage = async msg => {
  if (msg.type === 'run-linter') {
    const selections = figma.currentPage.selection.filter(
      node => node.type === 'FRAME'
    )

    if (selections.length === 0) {
      figma.ui.postMessage({
        type: 'error',
        message: 'Please select at least one frame',
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
