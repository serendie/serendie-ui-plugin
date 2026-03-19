import snapshotComponentKeys from '../../shared-src/assets/component-keys.json'
import snapshotComponentsManifest from '../../shared-src/assets/components_manifest.json'
import { ComponentKeysMap } from '../../shared-src/models/ComponentKeys'
import { ComponentManifestEntry } from '../../shared-src/models/ComponentManifest'
import ClientStorage from '../../shared-src/models/ClientStorage'

const REMOTE_COMPONENT_KEYS_URL =
  'https://serendie.design/assets/component-keys.json'
const REMOTE_COMPONENTS_MANIFEST_URL =
  'https://serendie.design/assets/components-manifest.json'

export const COMPONENT_ASSETS_TTL_MS = 3 * 24 * 60 * 60 * 1000
export const COMPONENT_ASSETS_RETRY_TTL_MS = 10 * 60 * 1000

type StorageLike = {
  getAsync(key: string): Promise<unknown>
  setAsync(key: string, value: unknown): Promise<void>
}

type FetchLike = typeof fetch

let componentKeysCache: ComponentKeysMap | null = null
let componentsManifestCache: ComponentManifestEntry[] | null = null

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string')
}

function isComponentKeysMap(value: unknown): value is ComponentKeysMap {
  if (!isRecord(value)) return false

  return Object.values(value).every(entry => {
    if (!isRecord(entry)) return false
    if (
      typeof entry.key !== 'string' ||
      typeof entry.name !== 'string' ||
      typeof entry.description !== 'string' ||
      typeof entry.nodeId !== 'string'
    ) {
      return false
    }
    if (entry.type !== 'COMPONENT' && entry.type !== 'COMPONENT_SET') {
      return false
    }
    if (entry.componentProperties === undefined) {
      return true
    }
    if (!Array.isArray(entry.componentProperties)) {
      return false
    }

    return entry.componentProperties.every(property => {
      if (!isRecord(property)) return false
      if (typeof property.name !== 'string' || typeof property.type !== 'string') {
        return false
      }

      switch (property.type) {
        case 'VARIANT':
          return isStringArray(property.options)
        case 'BOOLEAN':
          return typeof property.defaultValue === 'boolean'
        case 'TEXT':
          return typeof property.defaultValue === 'string'
        case 'INSTANCE_SWAP':
          return isStringArray(property.preferredComponentSets)
        default:
          return false
      }
    })
  })
}

function isComponentsManifest(value: unknown): value is ComponentManifestEntry[] {
  return (
    Array.isArray(value) &&
    value.every(entry => {
      if (!isRecord(entry)) return false
      return (
        typeof entry.name === 'string' && typeof entry.description === 'string'
      )
    })
  )
}

const FETCH_TIMEOUT_MS = 30_000

async function fetchJson(fetchImpl: FetchLike, url: string): Promise<unknown> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const response = await fetchImpl(url, { signal: controller.signal })
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`)
    }
    return response.json()
  } finally {
    clearTimeout(timeoutId)
  }
}

function setMemoryCaches(
  componentKeysMap: ComponentKeysMap,
  componentsManifest: ComponentManifestEntry[]
) {
  componentKeysCache = componentKeysMap
  componentsManifestCache = componentsManifest
}

let inflightRefresh: Promise<void> | null = null

export function resetRuntimeComponentAssetsCache() {
  componentKeysCache = null
  componentsManifestCache = null
  inflightRefresh = null
}

export function refreshRemoteComponentAssetsIfStale(opts?: {
  storage?: StorageLike
  fetchImpl?: FetchLike
  now?: () => number
}): Promise<void> {
  if (inflightRefresh) return inflightRefresh
  const promise = doRefreshRemoteComponentAssetsIfStale(opts)
  inflightRefresh = promise
  promise.finally(() => {
    inflightRefresh = null
  })
  return promise
}

async function doRefreshRemoteComponentAssetsIfStale({
  storage = figma.clientStorage,
  fetchImpl = fetch,
  now = () => Date.now(),
}: {
  storage?: StorageLike
  fetchImpl?: FetchLike
  now?: () => number
} = {}): Promise<void> {
  const [lastSyncedAt, lastAttemptedAt] = await Promise.all([
    storage.getAsync(ClientStorage.COMPONENT_ASSETS_SYNCED_AT),
    storage.getAsync(ClientStorage.COMPONENT_ASSETS_ATTEMPTED_AT),
  ])
  const lastSyncedMs =
    typeof lastSyncedAt === 'number' ? lastSyncedAt : Number(lastSyncedAt)
  const lastAttemptedMs =
    typeof lastAttemptedAt === 'number'
      ? lastAttemptedAt
      : Number(lastAttemptedAt)

  if (
    Number.isFinite(lastSyncedMs) &&
    now() - lastSyncedMs < COMPONENT_ASSETS_TTL_MS
  ) {
    return
  }

  if (
    Number.isFinite(lastAttemptedMs) &&
    now() - lastAttemptedMs < COMPONENT_ASSETS_RETRY_TTL_MS
  ) {
    return
  }

  try {
    const [componentKeysJson, componentsManifestJson] = await Promise.all([
      fetchJson(fetchImpl, REMOTE_COMPONENT_KEYS_URL),
      fetchJson(fetchImpl, REMOTE_COMPONENTS_MANIFEST_URL),
    ])

    if (!isComponentKeysMap(componentKeysJson)) {
      throw new Error('Invalid remote component keys payload')
    }
    if (!isComponentsManifest(componentsManifestJson)) {
      throw new Error('Invalid remote components manifest payload')
    }

    await Promise.all([
      storage.setAsync(
        ClientStorage.RUNTIME_COMPONENT_KEYS,
        componentKeysJson
      ),
      storage.setAsync(
        ClientStorage.RUNTIME_COMPONENTS_MANIFEST,
        componentsManifestJson
      ),
      storage.setAsync(ClientStorage.COMPONENT_ASSETS_SYNCED_AT, now()),
    ])

    setMemoryCaches(componentKeysJson, componentsManifestJson)
  } catch (error) {
    await storage
      .setAsync(ClientStorage.COMPONENT_ASSETS_ATTEMPTED_AT, now())
      .catch(() => {})
    console.warn('Failed to refresh remote component assets:', error)
  }
}

export async function getRuntimeComponentKeysMap(
  storage: StorageLike = figma.clientStorage
): Promise<ComponentKeysMap> {
  if (componentKeysCache) {
    return componentKeysCache
  }

  const stored = await storage.getAsync(ClientStorage.RUNTIME_COMPONENT_KEYS)
  if (isComponentKeysMap(stored)) {
    componentKeysCache = stored
    return stored
  }

  componentKeysCache = snapshotComponentKeys as ComponentKeysMap
  return componentKeysCache
}

export async function getRuntimeComponentsManifest(
  storage: StorageLike = figma.clientStorage
): Promise<ComponentManifestEntry[]> {
  if (componentsManifestCache) {
    return componentsManifestCache
  }

  const stored = await storage.getAsync(
    ClientStorage.RUNTIME_COMPONENTS_MANIFEST
  )
  if (isComponentsManifest(stored)) {
    componentsManifestCache = stored
    return stored
  }

  componentsManifestCache =
    snapshotComponentsManifest as ComponentManifestEntry[]
  return componentsManifestCache
}
