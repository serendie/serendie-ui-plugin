/**
 * Extract color information from Figma nodes
 */

interface ColorInfo {
  nodeId: string
  nodeName: string
  nodeType: string
  textColor: string
  backgroundColor: string
}

/**
 * Get variable name from a Figma variable
 */
function getVariableName(variable: Variable | null): string | null {
  if (!variable) return null
  return variable.name
}

/**
 * Get background color from a node by traversing up the tree
 */
async function getBackgroundColor(node: SceneNode): Promise<string | null> {
  if ('fills' in node && Array.isArray(node.fills) && node.fills.length > 0) {
    const fill = node.fills[0]
    if (fill.type === 'SOLID' && fill.visible !== false) {
      if ('boundVariables' in fill && fill.boundVariables?.color) {
        const variableId = fill.boundVariables.color.id
        const variable = await figma.variables.getVariableByIdAsync(variableId)
        return getVariableName(variable)
      }
    }
  }

  // Traverse up to find background color
  if (
    node.parent &&
    node.parent.type !== 'PAGE' &&
    node.parent.type !== 'DOCUMENT'
  ) {
    return getBackgroundColor(node.parent as SceneNode)
  }

  return null
}

/**
 * Extract colors from all nodes in the selection
 */
export async function extractNodeColors(node: SceneNode): Promise<ColorInfo[]> {
  const results: ColorInfo[] = []

  // Handle TEXT nodes
  if (node.type === 'TEXT') {
    const textNode = node as TextNode
    let textColor: string | null = null

    // Get text color
    if (
      'fills' in textNode &&
      Array.isArray(textNode.fills) &&
      textNode.fills.length > 0
    ) {
      const fill = textNode.fills[0]
      if (
        fill.type === 'SOLID' &&
        'boundVariables' in fill &&
        fill.boundVariables?.color
      ) {
        const variableId = fill.boundVariables.color.id
        const variable = await figma.variables.getVariableByIdAsync(variableId)
        textColor = getVariableName(variable)
      }
    }

    // Get background color by traversing up
    const backgroundColor = await getBackgroundColor(node.parent as SceneNode)

    results.push({
      nodeId: node.id,
      nodeName: node.name,
      nodeType: node.type,
      textColor: textColor || 'Unknown',
      backgroundColor: backgroundColor || 'Unknown',
    })
  }

  // Handle FRAME, RECTANGLE, COMPONENT, INSTANCE nodes
  const frameTypes = ['FRAME', 'RECTANGLE', 'COMPONENT', 'INSTANCE']
  if (frameTypes.includes(node.type)) {
    let backgroundColor: string | null = null
    let hasColor = false

    // Check if node has a fill color
    if ('fills' in node && Array.isArray(node.fills) && node.fills.length > 0) {
      const fill = node.fills[0]
      if (fill.type === 'SOLID' && fill.visible !== false) {
        hasColor = true
        if ('boundVariables' in fill && fill.boundVariables?.color) {
          const variableId = fill.boundVariables.color.id
          const variable = await figma.variables.getVariableByIdAsync(variableId)
          backgroundColor = getVariableName(variable)
        }
      }
    }

    // Only add to results if the frame has a color
    if (hasColor) {
      results.push({
        nodeId: node.id,
        nodeName: node.name,
        nodeType: node.type,
        textColor: 'None', // Frames don't have text color
        backgroundColor: backgroundColor || 'Unknown',
      })
    } else {
      // Add with 'None' to indicate no color
      results.push({
        nodeId: node.id,
        nodeName: node.name,
        nodeType: node.type,
        textColor: 'None',
        backgroundColor: 'None',
      })
    }
  }

  // Recursively check children
  if ('children' in node) {
    for (const child of node.children) {
      const childResults = await extractNodeColors(child)
      results.push(...childResults)
    }
  }

  return results
}
