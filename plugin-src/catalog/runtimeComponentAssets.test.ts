import ClientStorage from '../../shared-src/models/ClientStorage'
import {
  COMPONENT_ASSETS_TTL_MS,
  COMPONENT_ASSETS_RETRY_TTL_MS,
  getRuntimeComponentKeysMap,
  getRuntimeComponentsManifest,
  refreshRemoteComponentAssetsIfStale,
  resetRuntimeComponentAssetsCache,
} from './runtimeComponentAssets'

const componentKeys = {
  Button: {
    key: 'button-key',
    name: 'Button',
    description: 'Button description',
    nodeId: '1:1',
    type: 'COMPONENT_SET' as const,
  },
}

const componentsManifest = [
  {
    name: 'Button',
    description: 'Button manifest description',
  },
]

function createStorage(seed: Record<string, unknown> = {}) {
  const store = new Map(Object.entries(seed))
  return {
    getAsync: jest.fn(async (key: string) => store.get(key)),
    setAsync: jest.fn(async (key: string, value: unknown) => {
      store.set(key, value)
    }),
  }
}

describe('runtimeComponentAssets', () => {
  beforeEach(() => {
    resetRuntimeComponentAssetsCache()
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('TTL内なら remote fetch しない', async () => {
    const nowMs = Date.parse('2026-03-17T00:00:00.000Z')
    const storage = createStorage({
      [ClientStorage.COMPONENT_ASSETS_SYNCED_AT]:
        nowMs - COMPONENT_ASSETS_TTL_MS + 1000,
    })
    const fetchImpl = jest.fn()

    await refreshRemoteComponentAssetsIfStale({
      storage,
      fetchImpl: fetchImpl as never,
      now: () => nowMs,
    })

    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('stale なら remote を取得して storage に保存する', async () => {
    const nowMs = Date.parse('2026-03-17T00:00:00.000Z')
    const storage = createStorage({
      [ClientStorage.COMPONENT_ASSETS_SYNCED_AT]:
        nowMs - COMPONENT_ASSETS_TTL_MS - 1000,
    })
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => componentKeys,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => componentsManifest,
      })

    await refreshRemoteComponentAssetsIfStale({
      storage,
      fetchImpl: fetchImpl as never,
      now: () => nowMs,
    })

    expect(storage.setAsync).toHaveBeenCalledWith(
      ClientStorage.RUNTIME_COMPONENT_KEYS,
      componentKeys
    )
    expect(storage.setAsync).toHaveBeenCalledWith(
      ClientStorage.RUNTIME_COMPONENTS_MANIFEST,
      componentsManifest
    )
    expect(storage.setAsync).toHaveBeenCalledWith(
      ClientStorage.COMPONENT_ASSETS_SYNCED_AT,
      nowMs
    )
  })

  it('remote fetch が失敗しても例外を投げない', async () => {
    const storage = createStorage()
    const fetchImpl = jest.fn(async () => {
      throw new Error('network error')
    })

    await expect(
      refreshRemoteComponentAssetsIfStale({
        storage,
        fetchImpl: fetchImpl as never,
      })
    ).resolves.toBeUndefined()
  })

  it('失敗後にリトライTTL内なら再fetchしない', async () => {
    const nowMs = Date.parse('2026-03-17T00:00:00.000Z')
    const storage = createStorage()
    const fetchImpl = jest.fn(async () => {
      throw new Error('network error')
    })

    // 1回目: 失敗する
    await refreshRemoteComponentAssetsIfStale({
      storage,
      fetchImpl: fetchImpl as never,
      now: () => nowMs,
    })
    expect(fetchImpl).toHaveBeenCalled()

    // 2回目: リトライTTL内なのでfetchしない
    fetchImpl.mockClear()
    await refreshRemoteComponentAssetsIfStale({
      storage,
      fetchImpl: fetchImpl as never,
      now: () => nowMs + COMPONENT_ASSETS_RETRY_TTL_MS - 1000,
    })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('失敗後にリトライTTLを超えたら再fetchする', async () => {
    const nowMs = Date.parse('2026-03-17T00:00:00.000Z')
    const storage = createStorage()
    const fetchImpl = jest.fn(async () => {
      throw new Error('network error')
    })

    // 1回目: 失敗する
    await refreshRemoteComponentAssetsIfStale({
      storage,
      fetchImpl: fetchImpl as never,
      now: () => nowMs,
    })

    // 2回目: リトライTTLを超えたので再fetchする
    fetchImpl.mockClear()
    await refreshRemoteComponentAssetsIfStale({
      storage,
      fetchImpl: fetchImpl as never,
      now: () => nowMs + COMPONENT_ASSETS_RETRY_TTL_MS + 1000,
    })
    expect(fetchImpl).toHaveBeenCalled()
  })

  it('保存済み component keys を優先して返す', async () => {
    const storage = createStorage({
      [ClientStorage.RUNTIME_COMPONENT_KEYS]: componentKeys,
    })

    await expect(getRuntimeComponentKeysMap(storage)).resolves.toEqual(
      componentKeys
    )
  })

  it('保存済み manifest を優先して返す', async () => {
    const storage = createStorage({
      [ClientStorage.RUNTIME_COMPONENTS_MANIFEST]: componentsManifest,
    })

    await expect(getRuntimeComponentsManifest(storage)).resolves.toEqual(
      componentsManifest
    )
  })
})
