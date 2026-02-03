/**
 * Figmaコンポーネント固有の冗長なプロパティを自動補完する
 *
 * 【注意】これはFigmaコンポーネントの設計上の冗長性を吸収するためのワークアラウンドです。
 * SerendieのReactコンポーネントには存在しないが、Figmaコンポーネントには存在する
 * 冗長なプロパティを、他のプロパティ値に基づいて自動設定します。
 *
 * 現在の対応:
 * - TopAppBar: Type が "Navbar" 以外の場合、Navbar を false に設定
 *   (Figma上では Type と Navbar が別々のプロパティだが、実質的に連動している)
 */
export function applyFigmaSpecificDefaults(
  componentName: string,
  properties: Record<string, string | boolean | number>
): Record<string, string | boolean | number> {
  const result = { ...properties }

  if (componentName === 'TopAppBar') {
    // Type に応じて Navbar を設定（矛盾する値も上書き）
    const typeValue = String(
      result['Type'] ?? result['type'] ?? ''
    ).toLowerCase()
    if (typeValue === 'navbar') {
      result['Navbar'] = true
    } else if (typeValue) {
      result['Navbar'] = false
    }
  }

  return result
}
