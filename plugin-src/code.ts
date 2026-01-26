import extractColorInfo from './utils/extractColorInfo'
import { Issue } from '../shared-src/models/Rules'
import validateColorPairing from './utils/validateColorPairing'
import validateAssignFrameVariable from './utils/validateAssignFrameVariable'
import validateAssignTextVariable from './utils/validateAssignTextVariable'
import getImage, { canGetImage } from '../shared-src/utils/getImage'
import buildNodeStructure from './utils/buildNodeStructure'
import { NodeStructure } from '../shared-src/models/PluginMessage'
import { applyComponents } from './utils/applyComponent'

figma.showUI(__html__, {
  width: 360,
  height: 800,
  title: 'Serendie Design Linter',
})

let orderedSelectionIds: string[] = []

function getSelectionInfo() {
  // NOTE: Figmaプラグインでは選択順序が保存されない
  const currentSelection = figma.currentPage.selection
  const currentIds = new Set(currentSelection.map(node => node.id))
  orderedSelectionIds = orderedSelectionIds.filter(id => currentIds.has(id))
  const existingIds = new Set(orderedSelectionIds)
  for (const node of currentSelection) {
    if (!existingIds.has(node.id)) {
      orderedSelectionIds.push(node.id)
    }
  }
  const nodeMap = new Map(currentSelection.map(node => [node.id, node]))
  return orderedSelectionIds
    .map(id => nodeMap.get(id))
    .filter((node): node is SceneNode => node !== undefined)
    .map(node => ({
      id: node.id,
      name: node.name,
    }))
}

figma.on('selectionchange', () => {
  const selections = getSelectionInfo()
  figma.ui.postMessage({
    type: 'selection-changed',
    selections,
  })
})

figma.ui.onmessage = async msg => {
  if (msg.type === 'request-selection') {
    const selections = getSelectionInfo()
    figma.ui.postMessage({
      type: 'selection-changed',
      selections,
    })
  }
  if (msg.type === 'select-node') {
    const node = await figma.getNodeByIdAsync(msg.nodeId)
    if (node && 'type' in node) {
      figma.currentPage.selection = [node as SceneNode]
      figma.viewport.scrollAndZoomIntoView([node as SceneNode])
    }
  }
  if (msg.type === 'run-linter') {
    const nodes = await Promise.all(
      msg.nodeIds.map((id: string) => figma.getNodeByIdAsync(id))
    )
    const selections = nodes.filter(
      (node): node is SceneNode => node !== null && 'type' in node
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
        structure: NodeStructure
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

        const structure = await buildNodeStructure(selection)

        results.push({
          name: selection.name,
          id: selection.id,
          issues,
          totalNodes: colorInfoList.length,
          structure,
        })
      }

      figma.ui.postMessage({
        type: 'lint-result',
        results,
        source: msg.source,
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
  }
  if (msg.type === 'get-storage') {
    const value = await figma.clientStorage.getAsync(msg.key)
    figma.ui.postMessage({
      type: 'storage-value',
      key: msg.key,
      value,
    })
  }
  if (msg.type === 'set-storage') {
    try {
      await figma.clientStorage.setAsync(msg.key, msg.value)
      figma.ui.postMessage({
        type: 'storage-saved',
        key: msg.key,
      })
    } catch (error) {
      figma.ui.postMessage({
        type: 'storage-save-failed',
        key: msg.key,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
  if (msg.type === 'get-selection-images') {
    const nodeIds: string[] = msg.nodeIds ?? []
    const images = await Promise.all(
      nodeIds.map(async nodeId => {
        try {
          const node = await figma.getNodeByIdAsync(nodeId)
          if (node && canGetImage(node)) {
            const image = await getImage(node as FrameNode)
            return { nodeId, image }
          }
          return { nodeId, image: null }
        } catch {
          return { nodeId, image: null }
        }
      })
    )
    figma.ui.postMessage({ type: 'selection-images', images })
  }
  if (msg.type === 'clear-selection') {
    figma.currentPage.selection = []
  }
  if (msg.type === 'notify') {
    figma.notify(msg.message)
  }
  if (msg.type === 'apply-components') {
    try {
      const result = await applyComponents(msg.items)
      const messages: string[] = []
      if (result.success > 0) {
        messages.push(`${result.success}個適用`)
      }
      if (result.skipped > 0) {
        messages.push(`${result.skipped}個スキップ`)
      }
      if (messages.length > 0) {
        figma.notify(messages.join('、'))
      }
      if (result.failed > 0) {
        figma.notify(`${result.failed}個の適用に失敗しました`, {
          error: true,
        })
      }
    } catch (error) {
      figma.notify(
        error instanceof Error ? error.message : 'コンポーネントの適用に失敗しました',
        { error: true }
      )
    }
  }
  if (msg.type === 'close') {
    figma.closePlugin()
  }
}
