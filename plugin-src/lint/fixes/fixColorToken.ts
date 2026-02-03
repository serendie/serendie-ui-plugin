import {
  ColorTokenFixTarget,
  TokenFixResult,
} from '../../../shared-src/models/PluginMessage'
import {
  FALLBACK_TEXT_ROLES,
  FALLBACK_BACKGROUND_ROLES,
} from '../../../shared-src/models/Rules'
import { getReverseVariableMap } from '../extractors/getVariableMap'
import { convertRgbToHex } from '../core/convertRgbToHex'
import { pickBestFillColor } from './pickBestFillColor'

function getCurrentFillColor(node: SceneNode): { color: RGB } | null {
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

export async function fixColorTokens(
  targets: ColorTokenFixTarget[]
): Promise<TokenFixResult[]> {
  const reverseMap = await getReverseVariableMap()

  const results = await Promise.all(
    targets.map(async ({ nodeId, suggestion, targetProperty }) => {
      try {
        const baseNode = await figma.getNodeByIdAsync(nodeId)
        if (!baseNode || !('fills' in baseNode)) {
          return { nodeId: nodeId, status: 'failed' as const }
        }
        const node = baseNode as SceneNode

        const isFallback = !suggestion?.targetRoles
        const currentFill = isFallback ? getCurrentFillColor(node) : null
        const originalColorHex = currentFill
          ? convertRgbToHex(currentFill.color)
          : undefined

        const targetRoles =
          suggestion?.targetRoles ??
          (targetProperty === 'textColor'
            ? FALLBACK_TEXT_ROLES
            : FALLBACK_BACKGROUND_ROLES)

        const picked = await pickBestFillColor(node, targetRoles, reverseMap)
        if (!picked) {
          return { nodeId: nodeId, status: 'failed' as const }
        }

        applyVariableToFills(node, picked.variable)
        return {
          nodeId: nodeId,
          status: 'success' as const,
          appliedRole: picked.role,
          ...(isFallback && { isFallback: true }),
          ...(originalColorHex && { originalColorHex }),
        }
      } catch {
        return { nodeId, status: 'failed' as const }
      }
    })
  )

  return results
}
