/**
 * INSTANCE_SWAPプロパティの値をパースする
 * 形式: "ComponentSetName/VariantValue"
 * @returns パース結果、または形式が不正な場合はnull
 */
export function parseInstanceSwapValue(
  value: string
): { componentSetName: string; variantValue: string } | null {
  const slashIndex = value.indexOf('/')
  if (slashIndex === -1) return null

  return {
    componentSetName: value.slice(0, slashIndex),
    variantValue: value.slice(slashIndex + 1),
  }
}
