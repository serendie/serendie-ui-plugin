import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const REMOTE_COMPONENT_KEYS_URL =
  'https://serendie.design/assets/component-keys.json'
const REMOTE_COMPONENTS_MANIFEST_URL =
  'https://serendie.design/assets/components-manifest.json'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string')
}

function isComponentKeysJson(value: unknown): boolean {
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

function isComponentsManifestJson(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.every(entry => {
      if (!isRecord(entry)) return false
      if (
        typeof entry.name !== 'string' ||
        typeof entry.description !== 'string'
      ) {
        return false
      }
      return true
    })
  )
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`)
  }
  return response.json()
}

async function main() {
  const [componentKeys, componentsManifest] = await Promise.all([
    fetchJson(REMOTE_COMPONENT_KEYS_URL),
    fetchJson(REMOTE_COMPONENTS_MANIFEST_URL),
  ])

  if (!isComponentKeysJson(componentKeys)) {
    throw new Error('Invalid remote component keys payload')
  }
  if (!isComponentsManifestJson(componentsManifest)) {
    throw new Error('Invalid remote components manifest payload')
  }

  const assetsDir = path.resolve(__dirname, '../shared-src/assets')

  await Promise.all([
    fs.writeFile(
      path.join(assetsDir, 'component-keys.json'),
      `${JSON.stringify(componentKeys, null, 2)}\n`
    ),
    fs.writeFile(
      path.join(assetsDir, 'components_manifest.json'),
      `${JSON.stringify(componentsManifest, null, 2)}\n`
    ),
  ])
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
