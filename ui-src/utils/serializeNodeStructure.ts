import { NodeStructure } from '../../shared-src/models/PluginMessage'

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

  if (node.textStyle) {
    details.push(`textStyle: ${node.textStyle}`)
  }

  if (node.textContent) {
    details.push(`text: "${node.textContent}"`)
  }

  if (node.componentName) {
    details.push(`component: ${node.componentName}`)
  }

  if (node.componentProperties && node.componentProperties.length > 0) {
    const propsStr = node.componentProperties
      .map((p) => `${p.name}=${p.value}`)
      .join(', ')
    details.push(`props: {${propsStr}}`)
  }

  details.push(`size: ${node.width}x${node.height}`)

  const detailsStr = details.length > 0 ? ` ${details.join(', ')}` : ''

  let result = `${indentStr}- [${node.nodeId}] ${node.nodeName} (${node.nodeType})${detailsStr}\n`

  if (node.children.length > 0) {
    for (const child of node.children) {
      result += serializeNodeStructure(child, indent + 1)
    }
  }

  return result
}
