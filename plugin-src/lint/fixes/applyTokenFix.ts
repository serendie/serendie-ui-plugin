import { DesignTokenSuggestion } from '../../../shared-src/models/Rules'
import { getReverseVariableMap } from '../extractors/getVariableMap'
import { pickBestVariable } from './pickBestVariable'

export type ApplyTokenItem = {
  nodeId: string
  suggestion: DesignTokenSuggestion
}

export type ApplyTokenResult = {
  nodeId: string
  status: 'success' | 'failed'
  appliedRole?: string
}

function applyVariableToFills(node: SceneNode, variable: Variable) {
  if (!('fills' in node) || !Array.isArray(node.fills)) {
    throw new Error('No fills')
  }
  const fills = [...(node.fills as Paint[])]
  if (fills.length === 0) {
    throw new Error('No fills')
  }
  const firstFill = fills[0]
  if (firstFill.type !== 'SOLID') {
    throw new Error('First fill is not solid')
  }
  const newPaint = figma.variables.setBoundVariableForPaint(
    firstFill,
    'color',
    variable
  )
  fills[0] = newPaint
  node.fills = fills
}

export async function applyTokenFixes(
  items: ApplyTokenItem[]
): Promise<ApplyTokenResult[]> {
  const reverseMap = await getReverseVariableMap()
  const results: ApplyTokenResult[] = []

  for (const item of items) {
    try {
      const baseNode = await figma.getNodeByIdAsync(item.nodeId)
      if (!baseNode || !('fills' in baseNode)) {
        results.push({ nodeId: item.nodeId, status: 'failed' })
        continue
      }
      const node = baseNode as SceneNode

      const picked = await pickBestVariable(
        node,
        item.suggestion.targetRoles,
        reverseMap
      )
      if (!picked) {
        results.push({ nodeId: item.nodeId, status: 'failed' })
        continue
      }

      applyVariableToFills(node, picked.variable)
      results.push({
        nodeId: item.nodeId,
        status: 'success',
        appliedRole: picked.role,
      })
    } catch {
      results.push({ nodeId: item.nodeId, status: 'failed' })
    }
  }

  return results
}
