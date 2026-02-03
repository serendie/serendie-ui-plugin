import {
  ColorTokenFixTarget,
  TokenFixResult,
} from '../../../shared-src/models/PluginMessage'
import {
  DesignTokenIssue,
  Issue,
  isColorTokenIssue,
} from '../../../shared-src/models/Rules'
import extractColorInfo from '../extractors/extractColorInfo'
import extractBorderInfo from '../extractors/extractBorderInfo'
import { runLint } from '../validators/runLint'
import { fixColorTokens } from './fixColorToken'

const MAX_ITERATIONS = 5

function buildTargetsFromIssues(
  issues: DesignTokenIssue[]
): ColorTokenFixTarget[] {
  const seen = new Set<string>()
  const targets: ColorTokenFixTarget[] = []
  for (const issue of issues) {
    if (seen.has(issue.nodeId)) continue
    seen.add(issue.nodeId)
    const targetProperty =
      issue.nodeType === 'TEXT' ? 'textColor' : 'backgroundColor'
    // suggestionのtargetPropertyとノードのtargetPropertyが一致しない場合は
    // suggestionを無視してフォールバック候補を使う
    const suggestion =
      issue.suggestion && issue.suggestion.targetProperty === targetProperty
        ? issue.suggestion
        : undefined
    targets.push({
      nodeId: issue.nodeId,
      ...(suggestion && { suggestion }),
      targetProperty,
    })
  }
  return targets
}

export async function fixColorTokensRecursive(
  rootNode: SceneNode,
  initialTargets: ColorTokenFixTarget[]
): Promise<{
  results: TokenFixResult[]
  postFixIssues: Issue[]
  iterationCount: number
}> {
  const allResults: TokenFixResult[] = []
  let currentTargets = initialTargets
  let iterationCount = 0
  let postFixIssues: Issue[] | null = null

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    if (currentTargets.length === 0) break
    iterationCount++

    const results = await fixColorTokens(currentTargets)
    allResults.push(...results.filter(r => r.status === 'success'))
    if (results.every(r => r.status === 'failed')) break

    const [colorInfoList, borderInfoList] = await Promise.all([
      extractColorInfo(rootNode),
      extractBorderInfo(rootNode),
    ])
    postFixIssues = runLint(colorInfoList, borderInfoList)
    const remaining = postFixIssues.filter(isColorTokenIssue)
    if (remaining.length === 0) break

    currentTargets = buildTargetsFromIssues(remaining)
  }

  // re-lint 結果があればそれを再利用し、なければ final-lint を実行
  if (!postFixIssues) {
    const [finalColorInfo, finalBorderInfo] = await Promise.all([
      extractColorInfo(rootNode),
      extractBorderInfo(rootNode),
    ])
    postFixIssues = runLint(finalColorInfo, finalBorderInfo)
  }

  return {
    results: allResults,
    postFixIssues,
    iterationCount,
  }
}
