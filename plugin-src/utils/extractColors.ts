import notify from '../../shared-src/utils/notify'
import extractVariableKey from './extractVariableKey'

export const LIBRARY_NAME = '🛠️ Serendie UI Kit'
export const MANUAL_VALUE = 'Manual Value'

type ColorInfo = {
  nodeId: string
  nodeName: string
  nodeType: string
  textColor: string | null
  backgroundColor: string | null
}

let serendieVariableMap: Map<string, string> | null = null
async function loadVariables(): Promise<boolean> {
  if (serendieVariableMap) return true

  try {
    const allCollections =
      await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync()
    const collections = allCollections.filter(
      collection => collection.libraryName === LIBRARY_NAME
    )

    if (collections.length == 0) {
      notify(`${LIBRARY_NAME}をインポートしてください。`)
      return false
    }

    serendieVariableMap = new Map()
    for (const collection of collections) {
      const variables =
        await figma.teamLibrary.getVariablesInLibraryCollectionAsync(
          collection.key
        )
      for (const variable of variables) {
        serendieVariableMap.set(variable.key, variable.name)
      }
    }
  } catch (error) {
    notify(`${LIBRARY_NAME}の取得に失敗しました。`)
    return false
  }

  return true
}

function traceBackgroundColor(node: SceneNode): string | null {
  if ('fills' in node && Array.isArray(node.fills) && node.fills.length > 0) {
    const fill = node.fills[0]
    if (fill.type === 'SOLID' && fill.visible !== false) {
      if ('boundVariables' in fill && fill.boundVariables?.color) {
        const variableId = extractVariableKey(fill.boundVariables.color.id)
        if (variableId) {
          return serendieVariableMap?.get(variableId) || null
        }
      }
    }
  }
  if (
    node.parent &&
    node.parent.type !== 'PAGE' &&
    node.parent.type !== 'DOCUMENT'
  ) {
    return traceBackgroundColor(node.parent as SceneNode)
  }

  return null
}

export async function extractNodeColors(node: SceneNode): Promise<ColorInfo[]> {
  const loadingResult = await loadVariables()
  if (!loadingResult) {
    return []
  }

  const results: ColorInfo[] = []
  if (node.type === 'TEXT') {
    const textNode = node as TextNode
    let textColor: string | null = null
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
        const variableId = extractVariableKey(fill.boundVariables.color.id)
        if (variableId) {
          textColor = serendieVariableMap?.get(variableId) || null
        }
      }
    }
    const backgroundColor = traceBackgroundColor(node.parent as SceneNode)
    results.push({
      nodeId: node.id,
      nodeName: node.name,
      nodeType: node.type,
      textColor: textColor || MANUAL_VALUE,
      backgroundColor: backgroundColor || MANUAL_VALUE,
    })
  } else if (
    ['FRAME', 'RECTANGLE', 'COMPONENT', 'INSTANCE'].includes(node.type)
  ) {
    let backgroundColor: string | null = null
    let hasColor = false
    if ('fills' in node && Array.isArray(node.fills) && node.fills.length > 0) {
      const fill = node.fills[0]
      if (fill.type === 'SOLID' && fill.visible !== false) {
        hasColor = true
        if ('boundVariables' in fill && fill.boundVariables?.color) {
          const variableId = extractVariableKey(fill.boundVariables.color.id)
          if (variableId) {
            backgroundColor = serendieVariableMap?.get(variableId) || null
          }
        }
      }
    }
    if (hasColor) {
      results.push({
        nodeId: node.id,
        nodeName: node.name,
        nodeType: node.type,
        textColor: null,
        backgroundColor: backgroundColor || MANUAL_VALUE,
      })
    } else {
      results.push({
        nodeId: node.id,
        nodeName: node.name,
        nodeType: node.type,
        textColor: null,
        backgroundColor: null,
      })
    }
  }
  if ('children' in node) {
    for (const child of node.children) {
      const childResults = await extractNodeColors(child)
      results.push(...childResults)
    }
  }
  return results
}
