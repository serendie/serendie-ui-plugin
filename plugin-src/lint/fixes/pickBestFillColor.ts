import {
  ReverseVariableMap,
  importVariableCached,
} from '../extractors/getVariableMap'
import { getColorDistance } from '../core/getColorDistance'

export const CONTAINER_SIZE_THRESHOLD = 10000 // 100x100px の面積

export type Candidate = { role: string; distance: number }

export function pickBestCandidate(
  candidates: Candidate[],
  nodeArea: number
): Candidate | null {
  let best: Candidate | null = null
  for (const candidate of candidates) {
    if (!best || candidate.distance < best.distance) {
      best = candidate
    } else if (candidate.distance === best.distance) {
      const isContainer = candidate.role.includes('Container')
      const bestIsContainer = best.role.includes('Container')
      if (isContainer !== bestIsContainer) {
        const preferContainer = nodeArea >= CONTAINER_SIZE_THRESHOLD
        if (isContainer === preferContainer) {
          best = candidate
        }
      }
    }
  }
  return best
}

export function findVariableNameByRole(
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

export async function pickBestFillColor(
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

      const dist = getColorDistance(currentColor, resolvedColor)
      return { variable, role, distance: dist }
    } catch {
      return null
    }
  })

  const results = await Promise.all(promises)
  const resolved = results.filter(
    (r): r is { variable: Variable; role: string; distance: number } =>
      r !== null
  )

  const area =
    'width' in node && 'height' in node
      ? (node as { width: number; height: number }).width *
        (node as { width: number; height: number }).height
      : 0
  const picked = pickBestCandidate(
    resolved.map(r => ({ role: r.role, distance: r.distance })),
    area
  )
  if (!picked) return null

  const match = resolved.find(r => r.role === picked.role)
  return match ? { variable: match.variable, role: match.role } : null
}
