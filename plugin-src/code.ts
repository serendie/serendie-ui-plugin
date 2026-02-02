import extractColorInfo from './lint/extractors/extractColorInfo'
import extractBorderInfo from './lint/extractors/extractBorderInfo'
import { runLint } from './lint/validators/runLint'
import getImage, { canGetImage } from '../shared-src/utils/getImage'
import buildNodeStructure from './utils/nodes/buildNodeStructure'
import { LintResult } from '../shared-src/models/PluginMessage'
import { applyComponents } from './utils/components/applyComponent'
import { applyColorTokenFixRecursive } from './lint/fixes/applyColorTokenFixRecursive'
import { applyBorderTokenFixes } from './lint/fixes/applyBorderTokenFix'

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
      const results: LintResult[] = []
      for (const selection of selections) {
        const colorInfoList = await extractColorInfo(selection)
        const borderInfoList = await extractBorderInfo(selection)
        const issues = runLint(colorInfoList, borderInfoList)

        const structure =
          msg.source === 'component-validation'
            ? undefined
            : await buildNodeStructure(selection)

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
      const result = await applyComponents(msg.rootNodeId, msg.items)
      const successCount = result.results.filter(
        r => r.status === 'success'
      ).length
      const failedCount = result.results.filter(
        r => r.status === 'failed'
      ).length
      const skippedCount = result.results.filter(
        r => r.status === 'skipped'
      ).length

      const messages: string[] = []
      if (result.detached > 0) {
        messages.push(`${result.detached}個インスタンス解除`)
      }
      if (successCount > 0) {
        messages.push(`${successCount}個適用`)
      }
      if (skippedCount > 0) {
        messages.push(`${skippedCount}個スキップ`)
      }
      if (messages.length > 0) {
        figma.notify(messages.join('、'))
      }
      if (failedCount > 0) {
        figma.notify(`${failedCount}個の適用に失敗しました`, {
          error: true,
        })
      }

      // UIに適用結果を送信
      figma.ui.postMessage({
        type: 'apply-components-result',
        rootNodeId: msg.rootNodeId,
        results: result.results,
      })
    } catch (error) {
      figma.notify(
        error instanceof Error
          ? error.message
          : 'コンポーネントの適用に失敗しました',
        { error: true }
      )
    }
  }
  if (msg.type === 'apply-tokens') {
    try {
      const rootNode = await figma.getNodeByIdAsync(msg.rootNodeId)
      if (!rootNode || !('type' in rootNode)) {
        figma.notify('対象のノードが見つかりませんでした。', { error: true })
        return
      }

      const { results, finalIssues, iterationCount } =
        await applyColorTokenFixRecursive(rootNode as SceneNode, msg.items)

      const successCount = results.length
      const messages: string[] = []
      if (successCount > 0) messages.push(`${successCount}個修正`)
      if (iterationCount > 1) messages.push(`${iterationCount}回の反復`)
      const remainingCount = finalIssues.filter(
        i => i.source === 'design-token'
      ).length
      if (remainingCount > 0) messages.push(`${remainingCount}個の未解決あり`)
      if (messages.length > 0) figma.notify(messages.join('、'))

      figma.ui.postMessage({
        type: 'apply-color-tokens-result',
        rootNodeId: msg.rootNodeId,
        results,
        finalIssues,
      })
    } catch (error) {
      figma.notify(
        error instanceof Error ? error.message : 'トークンの修正に失敗しました',
        { error: true }
      )
    }
  }
  if (msg.type === 'apply-border-tokens') {
    try {
      const rootNode = await figma.getNodeByIdAsync(msg.rootNodeId)
      if (!rootNode || !('type' in rootNode)) {
        figma.notify('対象のノードが見つかりませんでした。', { error: true })
        return
      }

      const results = await applyBorderTokenFixes(msg.items)

      const successCount = results.filter(r => r.status === 'success').length
      if (successCount > 0) {
        figma.notify(`ボーダートークン: ${successCount}個修正`)
      }

      const finalColorInfo = await extractColorInfo(rootNode as SceneNode)
      const finalBorderInfo = await extractBorderInfo(rootNode as SceneNode)
      const finalIssues = runLint(finalColorInfo, finalBorderInfo)

      figma.ui.postMessage({
        type: 'apply-border-tokens-result',
        rootNodeId: msg.rootNodeId,
        results,
        finalIssues,
      })
    } catch (error) {
      figma.notify(
        error instanceof Error
          ? error.message
          : 'ボーダートークンの修正に失敗しました',
        { error: true }
      )
    }
  }
  if (msg.type === 'close') {
    figma.closePlugin()
  }
}
