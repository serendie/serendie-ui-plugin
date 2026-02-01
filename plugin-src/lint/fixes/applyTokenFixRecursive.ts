import {
  ApplyTokenItem,
  ApplyTokenResult,
} from '../../../shared-src/models/PluginMessage'
import { DesignTokenIssue, Issue } from '../../../shared-src/models/Rules'
import extractColorInfo from '../extractors/extractColorInfo'
import extractBorderInfo from '../extractors/extractBorderInfo'
import { runLint } from '../validators/runLint'
import { applyTokenFixes } from './applyTokenFix'

const MAX_ITERATIONS = 5

function buildItemsFromIssues(
  issues: DesignTokenIssue[]
): ApplyTokenItem[] {
  const seen = new Set<string>()
  const items: ApplyTokenItem[] = []
  for (const issue of issues) {
    if (seen.has(issue.nodeId)) continue
    seen.add(issue.nodeId)
    const targetProperty =
      issue.nodeType === 'TEXT' ? 'textColor' : 'backgroundColor'
    // suggestionのtargetPropertyとノードのtargetPropertyが一致しない場合は
    // suggestionを無視してフォールバック候補を使う
    const suggestion =
      issue.suggestion &&
      issue.suggestion.targetProperty === targetProperty
        ? issue.suggestion
        : undefined
    items.push({
      nodeId: issue.nodeId,
      ...(suggestion && { suggestion }),
      targetProperty,
    })
  }
  return items
}

export async function applyTokenFixRecursive(
  rootNode: SceneNode,
  initialItems: ApplyTokenItem[]
): Promise<{
  results: ApplyTokenResult[]
  finalIssues: Issue[]
  iterationCount: number
}> {
  const allResults: ApplyTokenResult[] = []
  let currentItems = initialItems
  let iterationCount = 0

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    if (currentItems.length === 0) break
    iterationCount++

    const results = await applyTokenFixes(currentItems)
    allResults.push(...results.filter(r => r.status === 'success'))
    if (results.every(r => r.status === 'failed')) break

    const colorInfoList = await extractColorInfo(rootNode)
    const borderInfoList = await extractBorderInfo(rootNode)
    const remaining = runLint(colorInfoList, borderInfoList).filter(
      (i): i is DesignTokenIssue => i.source === 'design-token'
    )
    if (remaining.length === 0) break
    currentItems = buildItemsFromIssues(remaining)
  }

  const finalColorInfo = await extractColorInfo(rootNode)
  const finalBorderInfo = await extractBorderInfo(rootNode)
  return {
    results: allResults,
    finalIssues: runLint(finalColorInfo, finalBorderInfo),
    iterationCount,
  }
}
