/**
 * プロパティ名から#以降のIDを除去
 * Figmaのプロパティ名は "Show Label#25710:0" のような形式になっていることがあるため
 * AIとのやり取りや比較時にはベース名だけを使用する
 *
 * @example
 * getBasePropName("Show Label#25710:0") // => "Show Label"
 * getBasePropName("Size") // => "Size"
 */
export function getBasePropName(name: string): string {
  return name.includes('#') ? name.slice(0, name.indexOf('#')) : name
}
