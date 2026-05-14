import { CUSTOM_VALUE, FRAME_TYPES } from '../../../shared-src/models/Rules'
import extractVariableKey from './extractVariableKey'
import getVariableMap, { VariableMap } from './getVariableMap'
import traceVisibility from './traceVisibility'

export type BorderInfo = {
  nodeId: string
  nodeName: string
  nodeType: string
  strokeColor: string | null
  strokeWeight: string | string[] | null
  cornerRadius: string | string[] | null
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
): string | null {
  if (!('strokes' in node) || !Array.isArray(node.strokes)) {
    return null
  }
  const strokes = node.strokes as Paint[]
  const solidStroke = strokes.find(
    s => s.type === 'SOLID' && s.visible !== false
  )
  if (!solidStroke) {
    return null
  }

  if ('boundVariables' in solidStroke && solidStroke.boundVariables?.color) {
    const variableId = extractVariableKey(solidStroke.boundVariables.color.id)
    if (variableId) {
      const tokenName = variableMap.get(variableId)
      if (tokenName) {
        return tokenName
      }
    }
  }

  return CUSTOM_VALUE
}

function extractStrokeWeight(
  node: SceneNode,
  variableMap: VariableMap
): string | string[] | null {
  if (!('strokeWeight' in node)) {
    return null
  }

  const sw = (node as MinimalStrokesMixin).strokeWeight
  if (sw === figma.mixed) {
    return extractIndividualStrokeWeight(node, variableMap)
  }

  if (!('boundVariables' in node) || !node.boundVariables) {
    return CUSTOM_VALUE
  }

  // Figma は統一ストロークでも boundVariables を個別キーで保持する場合がある
  const bv = node.boundVariables as {
    readonly [field in 'strokeWeight' | 'strokeTopWeight']?: VariableAlias
  }

  const alias = bv.strokeWeight || bv.strokeTopWeight
  if (!alias) {
    return CUSTOM_VALUE
  }

  const variableId = extractVariableKey(alias.id)
  if (variableId) {
    const tokenName = variableMap.get(variableId)
    if (tokenName) {
      return tokenName
    }
  }

  return CUSTOM_VALUE
}

function extractIndividualStrokeWeight(
  node: SceneNode,
  variableMap: VariableMap
): string[] | null {
  const sNode = node as IndividualStrokesMixin
  const hasAnyStroke =
    sNode.strokeTopWeight > 0 ||
    sNode.strokeBottomWeight > 0 ||
    sNode.strokeLeftWeight > 0 ||
    sNode.strokeRightWeight > 0

  if (!hasAnyStroke) {
    return null
  }

  const bv =
    'boundVariables' in node && node.boundVariables
      ? (node.boundVariables as {
          readonly [field in
            | 'strokeTopWeight'
            | 'strokeBottomWeight'
            | 'strokeLeftWeight'
            | 'strokeRightWeight']?: VariableAlias
        })
      : null

  const sides = [
    { alias: bv?.strokeTopWeight, value: sNode.strokeTopWeight },
    { alias: bv?.strokeBottomWeight, value: sNode.strokeBottomWeight },
    { alias: bv?.strokeLeftWeight, value: sNode.strokeLeftWeight },
    { alias: bv?.strokeRightWeight, value: sNode.strokeRightWeight },
  ]

  const tokenNames: string[] = []
  for (const side of sides) {
    if (side.value === 0) continue

    if (!side.alias) {
      tokenNames.push(CUSTOM_VALUE)
      continue
    }

    const variableId = extractVariableKey(side.alias.id)
    if (variableId) {
      const tokenName = variableMap.get(variableId)
      if (tokenName) {
        tokenNames.push(tokenName)
        continue
      }
    }

    tokenNames.push(CUSTOM_VALUE)
  }

  return tokenNames
}

function extractCornerRadius(
  node: SceneNode,
  variableMap: VariableMap
): string | string[] | null {
  if (!('cornerRadius' in node)) {
    return null
  }

  const radius = (node as CornerMixin).cornerRadius
  if (radius === 0 || radius === figma.mixed) {
    // mixed の場合は個別角丸を確認
    if (radius === figma.mixed) {
      return extractIndividualCornerRadius(node, variableMap)
    }
    return null
  }

  if (!('boundVariables' in node) || !node.boundVariables) {
    return CUSTOM_VALUE
  }

  const bv = node.boundVariables as {
    readonly [field in 'topLeftRadius']?: VariableAlias
  }

  const alias = bv.topLeftRadius
  if (!alias) {
    return CUSTOM_VALUE
  }

  const variableId = extractVariableKey(alias.id)
  if (variableId) {
    const tokenName = variableMap.get(variableId)
    if (tokenName) {
      return tokenName
    }
  }

  return CUSTOM_VALUE
}

function extractIndividualCornerRadius(
  node: SceneNode,
  variableMap: VariableMap
): string[] | null {
  const rNode = node as RectangleCornerMixin
  const hasAnyRadius =
    rNode.topLeftRadius > 0 ||
    rNode.topRightRadius > 0 ||
    rNode.bottomLeftRadius > 0 ||
    rNode.bottomRightRadius > 0

  if (!hasAnyRadius) {
    return null
  }

  const bv =
    'boundVariables' in node && node.boundVariables
      ? (node.boundVariables as {
          readonly [field in
            | 'topLeftRadius'
            | 'topRightRadius'
            | 'bottomLeftRadius'
            | 'bottomRightRadius']?: VariableAlias
        })
      : null

  const corners = [
    { alias: bv?.topLeftRadius, value: rNode.topLeftRadius },
    { alias: bv?.topRightRadius, value: rNode.topRightRadius },
    { alias: bv?.bottomLeftRadius, value: rNode.bottomLeftRadius },
    { alias: bv?.bottomRightRadius, value: rNode.bottomRightRadius },
  ]

  // 角丸 > 0 の各角ごとにトークン名 or CUSTOM_VALUE を収集
  const tokenNames: string[] = []
  for (const corner of corners) {
    if (corner.value === 0) continue

    if (!corner.alias) {
      tokenNames.push(CUSTOM_VALUE)
      continue
    }

    const variableId = extractVariableKey(corner.alias.id)
    if (variableId) {
      const tokenName = variableMap.get(variableId)
      if (tokenName) {
        tokenNames.push(tokenName)
        continue
      }
    }

    tokenNames.push(CUSTOM_VALUE)
  }

  return tokenNames
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
    const strokeColor = extractStrokeColor(node, variableMap)
    const strokeWeight = strokeColor
      ? extractStrokeWeight(node, variableMap)
      : null
    const cornerRadius = extractCornerRadius(node, variableMap)

    results.push({
      nodeId: node.id,
      nodeName: node.name,
      nodeType: node.type,
      strokeColor,
      strokeWeight,
      cornerRadius,
    })
  }

  if ('children' in node) {
    const childResults = await Promise.all(
      node.children.map(child => extractBorderInfo(child))
    )
    for (const r of childResults) {
      results.push(...r)
    }
  }

  return results
}
