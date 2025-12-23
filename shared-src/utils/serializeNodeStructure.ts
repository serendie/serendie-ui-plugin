import { NodeStructure } from '../models/PluginMessage'

export function serializeNodeStructure(
  node: NodeStructure,
  indent = 0
): string {
  const indentStr = '  '.repeat(indent)

  const details: string[] = []

  if (node.fills.length > 0) {
    details.push(`fills: [${node.fills.join(', ')}]`)
  }

  if (node.strokes.length > 0) {
    details.push(`strokes: [${node.strokes.join(', ')}]`)
  }

  details.push(`size: ${node.width}x${node.height}`)

  const detailsStr = details.length > 0 ? ` ${details.join(', ')}` : ''

  let result = `${indentStr}- ${node.nodeName} (${node.nodeType})${detailsStr}\n`

  if (node.children.length > 0) {
    for (const child of node.children) {
      result += serializeNodeStructure(child, indent + 1)
    }
  }

  return result
}
