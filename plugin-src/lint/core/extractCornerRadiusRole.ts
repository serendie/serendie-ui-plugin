import { CORNER_RADIUS_ROLES } from '../../../shared-src/models/Rules'

export default function extractCornerRadiusRole(
  variableName: string
): string | null {
  const parts = variableName.split('/')
  if (!parts.includes('radius')) return null

  const lastPart = parts[parts.length - 1]
  if (CORNER_RADIUS_ROLES.includes(lastPart)) {
    return lastPart
  }

  return null
}
