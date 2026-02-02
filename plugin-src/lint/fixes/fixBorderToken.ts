import {
  BorderTokenFixTarget,
  TokenFixResult,
} from '../../../shared-src/models/PluginMessage'
import {
  getReverseVariableMap,
  ReverseVariableMap,
} from '../extractors/getVariableMap'
import { getColorDistance } from '../core/getColorDistance'

type DimensionCandidate = {
  variable: Variable
  name: string
  value: number
}

type ColorCandidate = {
  variable: Variable
  name: string
  distance: number
}

const FULL_RADIUS_THRESHOLD = 9000

async function resolveDimensionCandidates(
  prefix: string,
  reverseMap: ReverseVariableMap,
  node: SceneNode
): Promise<DimensionCandidate[]> {
  const candidates: DimensionCandidate[] = []

  for (const [name, key] of reverseMap.entries()) {
    if (!name.includes(prefix)) continue

    try {
      const variable = await figma.variables.importVariableByKeyAsync(key)
      const result = variable.resolveForConsumer(node)
      if (result.resolvedType !== 'FLOAT') continue
      candidates.push({
        variable,
        name,
        value: result.value as number,
      })
    } catch {
      // 変数のインポートに失敗した場合はスキップ
    }
  }

  return candidates
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

export function shouldUseFull(
  radiusValue: number,
  nodeHeight: number
): boolean {
  return nodeHeight > 0 && radiusValue >= nodeHeight / 2
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

  const nodeHeight = 'height' in node ? (node as { height: number }).height : 0
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
        const useFullForCorner = shouldUseFull(value, nodeHeight)
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

      const useFull = shouldUseFull(currentRadius, nodeHeight)
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

async function resolveColorCandidates(
  reverseMap: ReverseVariableMap,
  node: SceneNode
): Promise<ColorCandidate[]> {
  if (!('strokes' in node) || !Array.isArray(node.strokes)) return []

  const strokes = node.strokes as Paint[]
  const solidStroke = strokes.find(
    s => s.type === 'SOLID' && s.visible !== false
  ) as SolidPaint | undefined
  if (!solidStroke) return []

  const currentColor = solidStroke.color
  const candidates: ColorCandidate[] = []

  for (const [name, key] of reverseMap.entries()) {
    // カラー変数のみ対象（dimension等は除外）
    if (name.includes('dimension/')) continue

    try {
      const variable = await figma.variables.importVariableByKeyAsync(key)
      const result = variable.resolveForConsumer(node)
      if (result.resolvedType !== 'COLOR') continue
      const resolvedColor = result.value as RGB

      const distance = getColorDistance(currentColor, resolvedColor)
      candidates.push({ variable, name, distance })
    } catch {
      // スキップ
    }
  }

  return candidates
}

async function fixStrokeColor(
  node: SceneNode,
  reverseMap: ReverseVariableMap
): Promise<TokenFixResult> {
  if (!('strokes' in node) || !Array.isArray(node.strokes)) {
    return { nodeId: node.id, status: 'failed' }
  }

  const candidates = await resolveColorCandidates(reverseMap, node)
  if (candidates.length === 0) {
    return { nodeId: node.id, status: 'failed' }
  }

  // RGB距離が最小の候補を選択
  let best: ColorCandidate | null = null
  for (const candidate of candidates) {
    if (!best || candidate.distance < best.distance) {
      best = candidate
    }
  }

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
      appliedRole: best.name,
    }
  } catch {
    return { nodeId: node.id, status: 'failed' }
  }
}

export async function fixBorderTokens(
  targets: BorderTokenFixTarget[]
): Promise<TokenFixResult[]> {
  const reverseMap = await getReverseVariableMap()
  const results: TokenFixResult[] = []

  for (const item of targets) {
    try {
      const baseNode = await figma.getNodeByIdAsync(item.nodeId)
      if (!baseNode) {
        results.push({ nodeId: item.nodeId, status: 'failed' })
        continue
      }
      const node = baseNode as SceneNode

      let result: TokenFixResult

      switch (item.targetProperty) {
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
          result = { nodeId: item.nodeId, status: 'failed' }
      }

      // 修正対象プロパティを結果に付与
      result.targetProperty = item.targetProperty
      results.push(result)
    } catch {
      results.push({ nodeId: item.nodeId, status: 'failed' })
    }
  }

  return results
}
