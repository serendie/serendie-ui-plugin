import {
  COLLECTION_NAME_LIST,
  LIBRARY_NAME,
} from '../../shared-src/models/Rules'
import notify from '../../shared-src/utils/notify'
import extractVariableKey from './extractVariableKey'

export type VariableMap = Map<string, string>

const variableMap: VariableMap = new Map()
export default async function getVariableMap(): Promise<VariableMap> {
  if (variableMap.size > 0) return variableMap

  try {
    const allCollections =
      await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync()
    const collections = allCollections.filter(
      collection => collection.libraryName === LIBRARY_NAME
    )
    if (collections.length == 0) {
      const success = await getLocalVariableMap()
      if (!success) {
        notify(`${LIBRARY_NAME}をインポートしてください。`)
      }
      return variableMap
    }

    for (const collection of collections) {
      const variables =
        await figma.teamLibrary.getVariablesInLibraryCollectionAsync(
          collection.key
        )
      for (const variable of variables) {
        const variableKey = extractVariableKey(variable.key)
        if (variableKey) {
          variableMap.set(variableKey, variable.name)
        }
      }
    }
  } catch (error) {
    notify(`${LIBRARY_NAME}の取得に失敗しました。`)
    variableMap.clear()
  }
  return variableMap
}

async function getLocalVariableMap() {
  const allCollections =
    await figma.variables.getLocalVariableCollectionsAsync()
  const collections = allCollections.filter(collection => {
    return COLLECTION_NAME_LIST.includes(collection.name)
  })
  if (collections.length == 0) {
    return false
  }

  for (const collection of collections) {
    const variablePromises = collection.variableIds.map(id =>
      figma.variables.getVariableByIdAsync(id)
    )
    const variables = await Promise.all(variablePromises)
    for (const variable of variables) {
      if (variable !== null) {
        // NOTE: ローカルライブラリから取得する場合は variable.id を 利用する
        const variableKey = extractVariableKey(variable.id)
        if (variableKey) {
          variableMap.set(variableKey, variable.name)
        }
      }
    }
  }
  return true
}
