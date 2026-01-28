// SerendieSymbols系のフォールバック候補（互換性があるため）
const SYMBOL_FALLBACKS: Record<string, string[]> = {
  OutlinedSerendieSymbols: ['FilledSerendieSymbols', 'SerendieSymbols'],
  FilledSerendieSymbols: ['OutlinedSerendieSymbols', 'SerendieSymbols'],
  SerendieSymbols: ['OutlinedSerendieSymbols', 'FilledSerendieSymbols'],
}

/**
 * 指定した名前のノードを再帰的に探索（最初に見つかったものを返す）
 * SerendieSymbols系のコンポーネントは互換性があるため、フォールバックを試みる
 */
export function findDescendantByName(
  node: SceneNode,
  name: string
): SceneNode | undefined {
  if (!('children' in node)) return undefined

  // 検索する名前のリストを作成（元の名前 + フォールバック）
  const namesToSearch = [name, ...(SYMBOL_FALLBACKS[name] || [])]

  for (const child of (node as FrameNode | InstanceNode).children) {
    // フォールバック含めてマッチするかチェック
    if (namesToSearch.includes(child.name)) return child
    const found = findDescendantByName(child, name)
    if (found) return found
  }
  return undefined
}
