export default function extractVariableKey(input: string): string | null {
  const withoutPrefix = input.replace(/^[A-Za-z]+ID:/, '')

  // NOTE: ローカル変数形式（例：4776:34700）をチェック
  const localKeyPattern = /^(\d+:\d+)$/
  const localMatch = withoutPrefix.match(localKeyPattern)
  if (localMatch) {
    return localMatch[1]
  }

  // NOTE: チームライブラリ形式（例：8c5ca44a0abb9000cd5405e7a94b77375c05cf8b/21527:34）をチェック
  const teamKeyPattern = /^([0-9a-f]+)(?:\/|$)/i
  const teamMatch = withoutPrefix.match(teamKeyPattern)
  return teamMatch ? teamMatch[1] : null
}
