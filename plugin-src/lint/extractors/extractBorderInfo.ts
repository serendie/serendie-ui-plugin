import { UNEXPECTED, FRAME_TYPES } from '../../../shared-src/models/Rules'
import extractVariableKey from './extractVariableKey'
import getVariableMap, { VariableMap } from './getVariableMap'
import traceVisibility from './traceVisibility'

export type BorderInfo = {
  nodeId: string
  nodeName: string
  nodeType: string
  strokeColor: string | null
  strokeWeight: string | null
  cornerRadius: string | null
  hasStroke: boolean
  hasCornerRadius: boolean
}

const BORDER_TARGET_TYPES = [
  ...FRAME_TYPES,
  'ELLIPSE',
  'POLYGON',
  'STAR',
  'LINE',
  'VECTOR',
] as const

function extractStrokeColor(
  node: SceneNode,
  variableMap: VariableMap
): { hasStroke: boolean; strokeColor: string | null } {
  if (!('strokes' in node) || !Array.isArray(node.strokes)) {
    return { hasStroke: false, strokeColor: null }
  }
  const strokes = node.strokes as Paint[]
  const solidStroke = strokes.find(
    (s) => s.type === 'SOLID' && s.visible !== false
  )
  if (!solidStroke) {
    return { hasStroke: false, strokeColor: null }
  }

  if ('boundVariables' in solidStroke && solidStroke.boundVariables?.color) {
    const variableId = extractVariableKey(
      solidStroke.boundVariables.color.id
    )
    if (variableId) {
      const tokenName = variableMap.get(variableId)
      if (tokenName) {
        return { hasStroke: true, strokeColor: tokenName }
      }
    }
  }

  return { hasStroke: true, strokeColor: UNEXPECTED }
}

function extractStrokeWeight(
  node: SceneNode,
  variableMap: VariableMap
): string | null {
  if (!('boundVariables' in node) || !node.boundVariables) {
    return UNEXPECTED
  }

  const bv = node.boundVariables as {
    readonly [field in
      | 'strokeWeight'
      | 'strokeTopWeight']?: VariableAlias
  }

  const alias = bv.strokeWeight || bv.strokeTopWeight
  if (!alias) {
    return UNEXPECTED
  }

  const variableId = extractVariableKey(alias.id)
  if (variableId) {
    const tokenName = variableMap.get(variableId)
    if (tokenName) {
      return tokenName
    }
  }

  return UNEXPECTED
}

function extractCornerRadius(
  node: SceneNode,
  variableMap: VariableMap
): { hasCornerRadius: boolean; cornerRadius: string | null } {
  if (!('cornerRadius' in node)) {
    return { hasCornerRadius: false, cornerRadius: null }
  }

  const radius = (node as CornerMixin).cornerRadius
  if (radius === 0 || radius === figma.mixed) {
    // mixed の場合は個別角丸を確認
    if (radius === figma.mixed) {
      return extractIndividualCornerRadius(node, variableMap)
    }
    return { hasCornerRadius: false, cornerRadius: null }
  }

  if (!('boundVariables' in node) || !node.boundVariables) {
    return { hasCornerRadius: true, cornerRadius: UNEXPECTED }
  }

  const bv = node.boundVariables as {
    readonly [field in 'topLeftRadius']?: VariableAlias
  }

  const alias = bv.topLeftRadius
  if (!alias) {
    return { hasCornerRadius: true, cornerRadius: UNEXPECTED }
  }

  const variableId = extractVariableKey(alias.id)
  if (variableId) {
    const tokenName = variableMap.get(variableId)
    if (tokenName) {
      return { hasCornerRadius: true, cornerRadius: tokenName }
    }
  }

  return { hasCornerRadius: true, cornerRadius: UNEXPECTED }
}

function extractIndividualCornerRadius(
  node: SceneNode,
  variableMap: VariableMap
): { hasCornerRadius: boolean; cornerRadius: string | null } {
  const rNode = node as RectangleCornerMixin
  const hasAnyRadius =
    rNode.topLeftRadius > 0 ||
    rNode.topRightRadius > 0 ||
    rNode.bottomLeftRadius > 0 ||
    rNode.bottomRightRadius > 0

  if (!hasAnyRadius) {
    return { hasCornerRadius: false, cornerRadius: null }
  }

  if (!('boundVariables' in node) || !node.boundVariables) {
    return { hasCornerRadius: true, cornerRadius: UNEXPECTED }
  }

  const bv = node.boundVariables as {
    readonly [field in
      | 'topLeftRadius'
      | 'topRightRadius'
      | 'bottomLeftRadius'
      | 'bottomRightRadius']?: VariableAlias
  }

  const corners = [
    { alias: bv.topLeftRadius, value: rNode.topLeftRadius },
    { alias: bv.topRightRadius, value: rNode.topRightRadius },
    { alias: bv.bottomLeftRadius, value: rNode.bottomLeftRadius },
    { alias: bv.bottomRightRadius, value: rNode.bottomRightRadius },
  ]

  // 角丸 > 0 の角ごとに変数が適用されているかチェック
  for (const corner of corners) {
    if (corner.value === 0) continue
    if (!corner.alias) {
      return { hasCornerRadius: true, cornerRadius: UNEXPECTED }
    }
    const variableId = extractVariableKey(corner.alias.id)
    if (!variableId || !variableMap.get(variableId)) {
      return { hasCornerRadius: true, cornerRadius: UNEXPECTED }
    }
  }

  // 全角トークン適用済み — 代表として最初の角丸 > 0 のトークン名を返す
  for (const corner of corners) {
    if (corner.value === 0 || !corner.alias) continue
    const variableId = extractVariableKey(corner.alias.id)
    if (variableId) {
      const tokenName = variableMap.get(variableId)
      if (tokenName) {
        return { hasCornerRadius: true, cornerRadius: tokenName }
      }
    }
  }

  return { hasCornerRadius: true, cornerRadius: UNEXPECTED }
}

export default async function extractBorderInfo(
  node: SceneNode
): Promise<BorderInfo[]> {
  const variableMap = await getVariableMap()
  if (variableMap.size === 0 || !traceVisibility(node)) {
    return []
  }

  const results: BorderInfo[] = []

  if (
    BORDER_TARGET_TYPES.includes(
      node.type as (typeof BORDER_TARGET_TYPES)[number]
    )
  ) {
    const { hasStroke, strokeColor } = extractStrokeColor(node, variableMap)
    const strokeWeight = hasStroke
      ? extractStrokeWeight(node, variableMap)
      : null
    const { hasCornerRadius, cornerRadius } = extractCornerRadius(
      node,
      variableMap
    )

    results.push({
      nodeId: node.id,
      nodeName: node.name,
      nodeType: node.type,
      strokeColor,
      strokeWeight,
      cornerRadius,
      hasStroke,
      hasCornerRadius,
    })
  }

  if ('children' in node) {
    for (const child of node.children) {
      const childResults = await extractBorderInfo(child)
      results.push(...childResults)
    }
  }

  return results
}
