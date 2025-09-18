import { COLOR_ROLES } from '../../shared-src/models/Rules'

export default function extractColorRole(variableName: string): string | null {
  const parts = variableName.split('/')
  const lastPart = parts[parts.length - 1]
  if (COLOR_ROLES.includes(lastPart)) {
    return lastPart
  }

  return null
}
