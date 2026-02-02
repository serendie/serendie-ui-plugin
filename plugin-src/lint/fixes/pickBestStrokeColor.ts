import { ReverseVariableMap } from '../extractors/getVariableMap'
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

  let best: { variable: Variable; role: string; distance: number } | null =
    null

  for (const role of targetRoles) {
    const variableName = findVariableNameByRole(reverseMap, role)
    if (!variableName) continue
    const fullKey = reverseMap.get(variableName)
    if (!fullKey) continue

    try {
      const variable =
        await figma.variables.importVariableByKeyAsync(fullKey)
      const result = variable.resolveForConsumer(node)
      if (result.resolvedType !== 'COLOR') continue
      const resolvedColor = result.value as RGB

      const distance = getColorDistance(currentColor, resolvedColor)
      if (!best || distance < best.distance) {
        best = { variable, role, distance }
      }
    } catch {
      // スキップ
    }
  }

  return best ? { variable: best.variable, role: best.role } : null
}
