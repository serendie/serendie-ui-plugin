export default function extractVariableKey(input: string): string | null {
  console.log(input)
  const withoutPrefix = input.replace(/^[A-Za-z]+ID:/, '')
  const keyPattern = /^([0-9a-f]+)(?:\/|$)/i
  const match = withoutPrefix.match(keyPattern)
  return match ? match[1] : null
}
