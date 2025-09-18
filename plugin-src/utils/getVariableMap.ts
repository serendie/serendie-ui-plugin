import { LIBRARY_NAME } from '../../shared-src/models/Rules'
import notify from '../../shared-src/utils/notify'
import extractVariableKey from '../core/extractVariableKey'

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
      notify(`${LIBRARY_NAME}をインポートしてください。`)
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
