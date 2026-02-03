const componentCache = new Map<string, Promise<ComponentNode>>()
const componentSetCache = new Map<string, Promise<ComponentSetNode>>()

export function importComponentByKeyCached(
  key: string
): Promise<ComponentNode> {
  const cached = componentCache.get(key)
  if (cached) return cached
  const promise = figma.importComponentByKeyAsync(key)
  componentCache.set(key, promise)
  return promise
}

export function importComponentSetByKeyCached(
  key: string
): Promise<ComponentSetNode> {
  const cached = componentSetCache.get(key)
  if (cached) return cached
  const promise = figma.importComponentSetByKeyAsync(key)
  componentSetCache.set(key, promise)
  return promise
}
