import extractVariableKey from './extractVariableKey'

export default function extractColorVariables(
  paints: readonly Paint[] | typeof figma.mixed,
  variableMap: Map<string, string>
): string[] {
  if (!Array.isArray(paints)) return []

  const results: string[] = []
  for (const paint of paints) {
    if (paint.type === 'SOLID' && paint.visible !== false) {
      if ('boundVariables' in paint && paint.boundVariables?.color) {
        const variableId = extractVariableKey(paint.boundVariables.color.id)
        if (variableId) {
          const tokenName = variableMap.get(variableId)
          if (tokenName) {
            results.push(tokenName)
          }
        }
      }
    }
  }
  return results
}
