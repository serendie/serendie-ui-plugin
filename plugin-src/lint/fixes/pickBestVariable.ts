import { ReverseVariableMap } from '../extractors/getVariableMap'
import { colorDistance } from '../core/colorDistance'

const CONTAINER_SIZE_THRESHOLD = 10000 // 100x100px の面積

function findVariableNameByRole(
  reverseMap: ReverseVariableMap,
  targetRole: string
): string | undefined {
  const suffix = `/${targetRole}`
  for (const name of reverseMap.keys()) {
    if (name.endsWith(suffix)) {
      return name
    }
  }
  return undefined
}

export async function pickBestVariable(
  node: SceneNode,
  targetRoles: string[],
  reverseMap: ReverseVariableMap
): Promise<{ variable: Variable; role: string } | null> {
  if (
    !('fills' in node) ||
    !Array.isArray(node.fills) ||
    node.fills.length === 0
  ) {
    return null
  }
  const currentFill = (node.fills as Paint[])[0]
  if (currentFill.type !== 'SOLID') return null
  const currentColor = currentFill.color

  let best: { variable: Variable; role: string; distance: number } | null =
    null

  for (const role of targetRoles) {
    const variableName = findVariableNameByRole(reverseMap, role)
    if (!variableName) continue
    const fullKey = reverseMap.get(variableName)
    if (!fullKey) continue

    const variable =
      await figma.variables.importVariableByKeyAsync(fullKey)
    const resolved = variable.resolveForConsumer(node)
    if (resolved.resolvedType !== 'COLOR') continue
    const resolvedColor = resolved.value as RGB

    const dist = colorDistance(currentColor, resolvedColor)
    if (!best || dist < best.distance) {
      best = { variable, role, distance: dist }
    } else if (dist === best.distance) {
      // 同じ色距離のContainer/無印ペアがある場合、ノードサイズで判定
      const isContainer = role.includes('Container')
      const bestIsContainer = best.role.includes('Container')
      if (isContainer !== bestIsContainer) {
        const area =
          'width' in node && 'height' in node
            ? (node as { width: number; height: number }).width *
              (node as { width: number; height: number }).height
            : 0
        const preferContainer = area >= CONTAINER_SIZE_THRESHOLD
        if (isContainer === preferContainer) {
          best = { variable, role, distance: dist }
        }
      }
    }
  }

  return best ? { variable: best.variable, role: best.role } : null
}
