/**
 * ネストしたプロパティの形式と処理
 *
 * 形式: "親インスタンス名/子インスタンス名.プロパティ名"
 * 例: "HeadingIconButton/SerendieSymbols.Name": "arrow_back"
 */

/**
 * ネストしたプロパティかどうかを判定
 * 形式: "Path/To/Instance.PropertyName"
 */
export function isNestedProperty(key: string): boolean {
  return key.includes('/') && key.includes('.')
}

/**
 * ネストしたプロパティをパース
 */
export function parseNestedProperty(
  key: string
): { path: string[]; propName: string } | null {
  const dotIndex = key.lastIndexOf('.')
  if (dotIndex === -1) return null
  const pathPart = key.slice(0, dotIndex)
  const propName = key.slice(dotIndex + 1)
  return { path: pathPart.split('/'), propName }
}

/**
 * AIプロンプト用のネストプロパティ説明文
 */
export const PROMPT_TO_NEST_PROPERTY = `- TopAppBarなどのコンポーネントでは、ネストしたインスタンスのプロパティを変更できます
  - 形式: "親インスタンス名/子インスタンス名.プロパティ名"
  - 例: "HeadingIconButton/SerendieSymbols.Name": "arrow_back"（ヘッダーアイコンを戻るボタンに変更）
  - 例: "TrailingIcon1/OutlinedSerendieSymbols.Name": "settings"（右端のアイコンを設定に変更）`
