import {
  BorderTokenFixTarget,
  TokenFixResult,
} from '../../../shared-src/models/PluginMessage'
import {
  getReverseVariableMap,
  ReverseVariableMap,
  importVariableCached,
} from '../extractors/getVariableMap'
import { FALLBACK_STROKE_ROLES } from '../../../shared-src/models/Rules'
import { pickBestStrokeColor } from './pickBestStrokeColor'

type DimensionCandidate = {
  variable: Variable
  name: string
  value: number
}

const FULL_RADIUS_THRESHOLD = 9000

async function resolveDimensionCandidates(
  prefix: string,
  reverseMap: ReverseVariableMap,
  node: SceneNode
): Promise<DimensionCandidate[]> {
  const entries = [...reverseMap.entries()].filter(([name]) =>
    name.includes(prefix)
  )

  const results = await Promise.all(
    entries.map(async ([name, key]) => {
      try {
        const variable = await importVariableCached(key)
        const result = variable.resolveForConsumer(node)
        if (result.resolvedType !== 'FLOAT') return null
        return { variable, name, value: result.value as number }
      } catch {
        return null
      }
    })
  )

  return results.filter((r): r is DimensionCandidate => r !== null)
}

export function findClosestCandidate(
  currentValue: number,
  candidates: DimensionCandidate[]
): DimensionCandidate | null {
  if (candidates.length === 0) return null

  let best: DimensionCandidate | null = null
  let bestDistance = Infinity

  for (const candidate of candidates) {
    const distance = Math.abs(currentValue - candidate.value)
    if (distance < bestDistance) {
      bestDistance = distance
      best = candidate
    }
  }

  return best
}

export function shouldUseFull(radiusValue: number, minSide: number): boolean {
  return minSide > 0 && radiusValue >= minSide / 2
}

function isFullRadiusCandidate(candidate: DimensionCandidate): boolean {
  return (
    candidate.value >= FULL_RADIUS_THRESHOLD && candidate.name.includes('full')
  )
}

async function fixStrokeWeight(
  node: SceneNode,
  reverseMap: ReverseVariableMap
): Promise<TokenFixResult> {
  const candidates = await resolveDimensionCandidates(
    'dimension/border/',
    reverseMap,
    node
  )

  if (!('strokeWeight' in node)) {
    return { nodeId: node.id, status: 'failed' }
  }

  const sw = (node as MinimalStrokesMixin).strokeWeight

  try {
    if (sw === figma.mixed) {
      // 個別ストローク
      const sNode = node as IndividualStrokesMixin
      const fields = [
        {
          field: 'strokeTopWeight' as const,
          value: sNode.strokeTopWeight,
        },
        {
          field: 'strokeBottomWeight' as const,
          value: sNode.strokeBottomWeight,
        },
        {
          field: 'strokeLeftWeight' as const,
          value: sNode.strokeLeftWeight,
        },
        {
          field: 'strokeRightWeight' as const,
          value: sNode.strokeRightWeight,
        },
      ]

      const appliedNames: string[] = []
      for (const { field, value } of fields) {
        if (value === 0) continue
        const best = findClosestCandidate(value, candidates)
        if (best) {
          node.setBoundVariable(field, best.variable)
          appliedNames.push(best.name)
        }
      }

      return {
        nodeId: node.id,
        status: appliedNames.length > 0 ? 'success' : 'failed',
        ...(appliedNames.length > 0 && { appliedRole: appliedNames }),
      }
    } else {
      // 統一ストローク
      const currentWeight = typeof sw === 'number' ? sw : 1

      const best = findClosestCandidate(currentWeight, candidates)
      if (!best) {
        return { nodeId: node.id, status: 'failed' }
      }

      node.setBoundVariable('strokeWeight', best.variable)
      return {
        nodeId: node.id,
        status: 'success',
        appliedRole: best.name,
      }
    }
  } catch {
    return { nodeId: node.id, status: 'failed' }
  }
}

async function fixCornerRadius(
  node: SceneNode,
  reverseMap: ReverseVariableMap
): Promise<TokenFixResult> {
  const candidates = await resolveDimensionCandidates(
    'dimension/radius/',
    reverseMap,
    node
  )

  if (!('cornerRadius' in node)) {
    return { nodeId: node.id, status: 'failed' }
  }

  const nodeWidth = 'width' in node ? (node as { width: number }).width : 0
  const nodeHeight = 'height' in node ? (node as { height: number }).height : 0
  const minSide = Math.min(nodeWidth, nodeHeight)
  const fullCandidate = candidates.find(isFullRadiusCandidate)
  const normalCandidates = candidates.filter(c => !isFullRadiusCandidate(c))

  const cornerNode = node as CornerMixin & RectangleCornerMixin

  try {
    if (cornerNode.cornerRadius === figma.mixed) {
      // 個別角丸
      const fields = [
        {
          field: 'topLeftRadius' as const,
          value: cornerNode.topLeftRadius,
        },
        {
          field: 'topRightRadius' as const,
          value: cornerNode.topRightRadius,
        },
        {
          field: 'bottomLeftRadius' as const,
          value: cornerNode.bottomLeftRadius,
        },
        {
          field: 'bottomRightRadius' as const,
          value: cornerNode.bottomRightRadius,
        },
      ]

      const appliedNames: string[] = []
      for (const { field, value } of fields) {
        if (value === 0) continue
        const useFullForCorner = shouldUseFull(value, minSide)
        if (useFullForCorner && fullCandidate) {
          node.setBoundVariable(field, fullCandidate.variable)
          appliedNames.push(fullCandidate.name)
        } else {
          const best = findClosestCandidate(value, normalCandidates)
          if (best) {
            node.setBoundVariable(field, best.variable)
            appliedNames.push(best.name)
          }
        }
      }

      return {
        nodeId: node.id,
        status: appliedNames.length > 0 ? 'success' : 'failed',
        ...(appliedNames.length > 0 && { appliedRole: appliedNames }),
      }
    } else {
      // 統一角丸
      const currentRadius =
        typeof cornerNode.cornerRadius === 'number'
          ? cornerNode.cornerRadius
          : 0

      if (currentRadius === 0) {
        return { nodeId: node.id, status: 'failed' }
      }

      const useFull = shouldUseFull(currentRadius, minSide)
      let best: DimensionCandidate | null = null

      if (useFull && fullCandidate) {
        best = fullCandidate
      } else {
        best = findClosestCandidate(currentRadius, normalCandidates)
      }

      if (!best) {
        return { nodeId: node.id, status: 'failed' }
      }

      // 4角全てに適用
      const cornerFields = [
        'topLeftRadius',
        'topRightRadius',
        'bottomLeftRadius',
        'bottomRightRadius',
      ] as const
      for (const field of cornerFields) {
        node.setBoundVariable(field, best.variable)
      }

      return {
        nodeId: node.id,
        status: 'success',
        appliedRole: best.name,
      }
    }
  } catch {
    return { nodeId: node.id, status: 'failed' }
  }
}

async function fixStrokeColor(
  node: SceneNode,
  reverseMap: ReverseVariableMap
): Promise<TokenFixResult> {
  if (!('strokes' in node) || !Array.isArray(node.strokes)) {
    return { nodeId: node.id, status: 'failed' }
  }

  const best = await pickBestStrokeColor(
    node,
    FALLBACK_STROKE_ROLES,
    reverseMap
  )
  if (!best) {
    return { nodeId: node.id, status: 'failed' }
  }

  try {
    const strokes = [...(node.strokes as Paint[])]
    const strokeIndex = strokes.findIndex(
      s => s.type === 'SOLID' && s.visible !== false
    )
    if (strokeIndex === -1) {
      return { nodeId: node.id, status: 'failed' }
    }

    const newPaint = figma.variables.setBoundVariableForPaint(
      strokes[strokeIndex] as SolidPaint,
      'color',
      best.variable
    )
    strokes[strokeIndex] = newPaint
    ;(node as GeometryMixin).strokes = strokes

    return {
      nodeId: node.id,
      status: 'success',
      appliedRole: best.role,
    }
  } catch {
    return { nodeId: node.id, status: 'failed' }
  }
}

const CHUNK_SIZE = 20

export async function fixBorderTokens(
  targets: BorderTokenFixTarget[]
): Promise<TokenFixResult[]> {
  const reverseMap = await getReverseVariableMap()

  const allResults: TokenFixResult[] = []

  for (let i = 0; i < targets.length; i += CHUNK_SIZE) {
    const chunk = targets.slice(i, i + CHUNK_SIZE)
    const results = await Promise.all(
      chunk.map(async ({ nodeId, targetProperty }) => {
        try {
          const baseNode = await figma.getNodeByIdAsync(nodeId)
          if (!baseNode) {
            return { nodeId: nodeId, status: 'failed' as const }
          }
          const node = baseNode as SceneNode

          let result: TokenFixResult

          switch (targetProperty) {
            case 'strokeWeight':
              result = await fixStrokeWeight(node, reverseMap)
              break
            case 'cornerRadius':
              result = await fixCornerRadius(node, reverseMap)
              break
            case 'strokeColor':
              result = await fixStrokeColor(node, reverseMap)
              break
            default:
              result = { nodeId: nodeId, status: 'failed' }
          }

          // 修正対象プロパティを結果に付与
          result.targetProperty = targetProperty
          return result
        } catch {
          return { nodeId: nodeId, status: 'failed' as const }
        }
      })
    )
    allResults.push(...results)
  }

}
