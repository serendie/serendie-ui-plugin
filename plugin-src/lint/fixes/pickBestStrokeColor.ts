import {
  ReverseVariableMap,
  importVariableCached,
} from '../extractors/getVariableMap'
import { getColorDistance } from '../core/getColorDistance'
import { findVariableNameByRole } from './pickBestFillColor'

export async function pickBestStrokeColor(
  node: SceneNode,
  targetRoles: string[],
  reverseMap: ReverseVariableMap
): Promise<{ variable: Variable; role: string } | null> {
  if (!('strokes' in node) || !Array.isArray(node.strokes)) return null

  const strokes = node.strokes as Paint[]
  const solidStroke = strokes.find(
    s => s.type === 'SOLID' && s.visible !== false
  ) as SolidPaint | undefined
  if (!solidStroke) return null

  const currentColor = solidStroke.color

  const promises = targetRoles.map(async role => {
    const variableName = findVariableNameByRole(reverseMap, role)
    if (!variableName) return null
    const fullKey = reverseMap.get(variableName)
    if (!fullKey) return null

    try {
      const variable = await importVariableCached(fullKey)
      const result = variable.resolveForConsumer(node)
      if (result.resolvedType !== 'COLOR') return null
      const resolvedColor = result.value as RGB

      const distance = getColorDistance(currentColor, resolvedColor)
      return { variable, role, distance }
    } catch {
      return null
    }
  })

  const results = await Promise.all(promises)
  const resolved = results.filter(
    (r): r is { variable: Variable; role: string; distance: number } =>
      r !== null
  )

  let best: { variable: Variable; role: string; distance: number } | null = null
  for (const candidate of resolved) {
    if (!best || candidate.distance < best.distance) {
      best = candidate
    }
  }

  return best ? { variable: best.variable, role: best.role } : null
}
