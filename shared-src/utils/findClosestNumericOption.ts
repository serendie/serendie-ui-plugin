/**
 * 数値オプションから最も近い値を見つける
 * @param value 探したい値
 * @param options 選択肢の配列
 * @returns 最も近いオプション、または見つからない場合はundefined
 */
export function findClosestNumericOption(
  value: number,
  options: string[]
): string | undefined {
  const numericOptions = options
    .map(opt => ({ opt, num: Number(opt) }))
    .filter(x => !isNaN(x.num))

  if (numericOptions.length === 0) return undefined

  const closest = numericOptions.reduce((a, b) =>
    Math.abs(b.num - value) < Math.abs(a.num - value) ? b : a
  )
  return closest.opt
}
