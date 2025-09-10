import { extractNodeColors } from './extractColors'
import { validateColorPairs } from './rules/colorPairing'
import { ColorValidationResult } from '../shared-src/models/ColorValidation'

// Show UI on plugin run
figma.showUI(__html__, {
  width: 500,
  height: 600,
  title: 'Spread System Color Linter',
})

// Listen for messages from UI
figma.ui.onmessage = async msg => {
  if (msg.type === 'run-linter') {
    // Get selected frames
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
      // Extract colors from the frame
      const colorPairs = await extractNodeColors(selection)

      // Validate using rule-based system
      const result: ColorValidationResult = validateColorPairs(colorPairs)

      // Send results to UI
      figma.ui.postMessage({
        type: 'lint-result',
        result,
        totalNodes: colorPairs.length,
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
