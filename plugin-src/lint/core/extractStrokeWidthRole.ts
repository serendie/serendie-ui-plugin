import { STROKE_WIDTH_ROLES } from '../../../shared-src/models/Rules'

export default function extractStrokeWidthRole(
  variableName: string
): string | null {
  const parts = variableName.split('/')
  if (!parts.includes('border')) return null

  const lastPart = parts[parts.length - 1]
  if (STROKE_WIDTH_ROLES.includes(lastPart)) {
    return lastPart
  }

  return null
}
