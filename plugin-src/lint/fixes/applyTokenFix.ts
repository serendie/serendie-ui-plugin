import {
  ApplyTokenItem,
  ApplyTokenResult,
} from '../../../shared-src/models/PluginMessage'
import {
  FALLBACK_TEXT_ROLES,
  FALLBACK_BACKGROUND_ROLES,
} from '../../../shared-src/models/Rules'
import { getReverseVariableMap } from '../extractors/getVariableMap'
import { pickBestVariable } from './pickBestVariable'

function rgbToHex(color: RGB): string {
  const r = Math.round(color.r * 255)
  const g = Math.round(color.g * 255)
  const b = Math.round(color.b * 255)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

function getCurrentFillColor(
  node: SceneNode
): { color: RGB } | null {
  if (!('fills' in node) || !Array.isArray(node.fills)) return null
  const fills = node.fills as Paint[]
  if (fills.length === 0) return null
  const firstFill = fills[0]
  if (firstFill.type !== 'SOLID') return null
  return { color: firstFill.color }
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

      const isFallback = !item.suggestion?.targetRoles
      const currentFill = isFallback ? getCurrentFillColor(node) : null
      const originalColorHex = currentFill
        ? rgbToHex(currentFill.color)
        : undefined

      const targetRoles =
        item.suggestion?.targetRoles ??
        (item.targetProperty === 'textColor'
          ? FALLBACK_TEXT_ROLES
          : FALLBACK_BACKGROUND_ROLES)

      const picked = await pickBestVariable(node, targetRoles, reverseMap)
      if (!picked) {
        results.push({ nodeId: item.nodeId, status: 'failed' })
        continue
      }

      applyVariableToFills(node, picked.variable)
      results.push({
        nodeId: item.nodeId,
        status: 'success',
        appliedRole: picked.role,
        ...(isFallback && { isFallback: true }),
        ...(originalColorHex && { originalColorHex }),
      })
    } catch {
      results.push({ nodeId: item.nodeId, status: 'failed' })
    }
  }

  return results
}
