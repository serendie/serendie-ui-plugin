#!/usr/bin/env npx tsx

/**
 * Figma REST APIを使用してSerendie UIライブラリのコンポーネントキーを取得し、
 * assets/component-keys.json に保存するスクリプト
 *
 * 環境変数:
 * - FIGMA_FILE_KEY: Serendie UIライブラリのFigma File Key
 * - FIGMA_API_TOKEN: Figma Personal Access Token
 *
 * 使用方法:
 * 1. .envファイルに環境変数を設定
 * 2. npx tsx scripts/fetch-component-keys.ts を実行
 */

import * as https from 'https'
import * as fs from 'fs'
import * as path from 'path'
import { config } from 'dotenv'
import type {
  ComponentPropertyDef,
  ComponentKeysMap,
} from '../shared-src/models/ComponentKeys'

// .env.localを優先的に読み込み、なければ.envを読み込む
config({ path: '.env.local' })
config({ path: '.env' })

const fileKey = process.env.FIGMA_SERENDIE_UI_KIT_FILE_KEY
const accessToken = process.env.FIGMA_PERSONAL_ACCESS_TOKEN

// Figma APIレスポンスの型定義
interface FigmaComponent {
  key: string
  name: string
  description: string
  node_id: string
}

interface FigmaComponentsResponse {
  meta?: {
    components?: FigmaComponent[]
  }
}

interface FigmaComponentSetsResponse {
  meta?: {
    component_sets?: FigmaComponent[]
  }
}

// ノード詳細レスポンスの型定義（Figma API）
type ComponentPropertyDefinition =
  | { type: 'VARIANT'; variantOptions: string[] }
  | { type: 'BOOLEAN'; defaultValue: boolean }
  | { type: 'TEXT'; defaultValue: string }
  | { type: 'INSTANCE_SWAP' }

interface FigmaNodeDocument {
  componentPropertyDefinitions?: Record<string, ComponentPropertyDefinition>
}

interface FigmaNodesResponse {
  nodes: Record<
    string,
    {
      document?: FigmaNodeDocument
    }
  >
}


async function fetchFigmaAPI<T>(endpoint: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const options: https.RequestOptions = {
      hostname: 'api.figma.com',
      path: endpoint,
      method: 'GET',
      headers: {
        'X-Figma-Token': accessToken,
      },
    }

    const req = https.request(options, res => {
      let data = ''
      res.on('data', (chunk: string) => {
        data += chunk
      })
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data) as T)
        } else {
          reject(new Error(`Figma API error: ${res.statusCode} - ${data}`))
        }
      })
    })

    req.on('error', reject)
    req.end()
  })
}

async function main(): Promise<void> {
  // 環境変数チェック
  if (!fileKey || !accessToken) {
    console.log(
      'FIGMA_FILE_KEY または FIGMA_API_TOKEN が設定されていません。スキップします。'
    )
    console.log(
      'コンポーネントキーを取得するには .env ファイルに以下を設定してください:'
    )
    console.log('  FIGMA_FILE_KEY=xxxxx')
    console.log('  FIGMA_API_TOKEN=figd_xxxxx')
    return
  }

  console.log('Figma APIからコンポーネントを取得中...')

  try {
    // コンポーネント一覧を取得
    const componentsResponse = await fetchFigmaAPI<FigmaComponentsResponse>(
      `/v1/files/${fileKey}/components`
    )

    // コンポーネントセット一覧を取得（バリアント付きコンポーネント用）
    const componentSetsResponse =
      await fetchFigmaAPI<FigmaComponentSetsResponse>(
        `/v1/files/${fileKey}/component_sets`
      )

    const componentKeys: ComponentKeysMap = {}

    // コンポーネントセット（バリアント付き）を処理
    const componentSetNodeIds: string[] = []
    if (componentSetsResponse.meta?.component_sets) {
      for (const componentSet of componentSetsResponse.meta.component_sets) {
        const name = componentSet.name
        componentKeys[name] = {
          key: componentSet.key,
          name: name,
          description: componentSet.description || '',
          nodeId: componentSet.node_id,
          type: 'COMPONENT_SET',
        }
        componentSetNodeIds.push(componentSet.node_id)
      }
    }

    // コンポーネントセットのバリアント情報を取得
    if (componentSetNodeIds.length > 0) {
      console.log('バリアント情報を取得中...')

      // Figma APIは一度に多くのノードを取得できるが、URLの長さ制限があるため分割
      const BATCH_SIZE = 50
      for (let i = 0; i < componentSetNodeIds.length; i += BATCH_SIZE) {
        const batchIds = componentSetNodeIds.slice(i, i + BATCH_SIZE)
        const idsParam = batchIds.join(',')

        const nodesResponse = await fetchFigmaAPI<FigmaNodesResponse>(
          `/v1/files/${fileKey}/nodes?ids=${encodeURIComponent(idsParam)}`
        )

        // 各ノードからバリアントプロパティを抽出
        for (const [nodeId, nodeData] of Object.entries(nodesResponse.nodes)) {
          const propDefs = nodeData.document?.componentPropertyDefinitions
          if (!propDefs) continue

          // このnodeIdに対応するコンポーネント名を探す
          const componentEntry = Object.entries(componentKeys).find(
            ([, info]) => info.nodeId === nodeId
          )
          if (!componentEntry) continue

          const [componentName] = componentEntry
          const componentProperties: ComponentPropertyDef[] = []

          for (const [propName, propDef] of Object.entries(propDefs)) {
            if (propDef.type === 'VARIANT' && propDef.variantOptions) {
              componentProperties.push({
                name: propName,
                type: 'VARIANT',
                options: propDef.variantOptions,
              })
            } else if (propDef.type === 'BOOLEAN') {
              componentProperties.push({
                name: propName,
                type: 'BOOLEAN',
                defaultValue: propDef.defaultValue,
              })
            } else if (propDef.type === 'TEXT') {
              componentProperties.push({
                name: propName,
                type: 'TEXT',
                defaultValue: propDef.defaultValue,
              })
            }
          }

          if (componentProperties.length > 0) {
            componentKeys[componentName].componentProperties = componentProperties
          }
        }
      }
    }

    // 個別コンポーネントを処理（コンポーネントセットに含まれないもの）
    if (componentsResponse.meta?.components) {
      for (const component of componentsResponse.meta.components) {
        // コンポーネントセットの子（バリアント）は含めない
        // 名前に "/" が含まれる場合はバリアントの可能性が高い
        const name = component.name
        if (!name.includes('/') && !componentKeys[name]) {
          componentKeys[name] = {
            key: component.key,
            name: name,
            description: component.description || '',
            nodeId: component.node_id,
            type: 'COMPONENT',
          }
        }
      }
    }

    // 出力ディレクトリ確認
    const outputDir = path.resolve(__dirname, '../assets')
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // JSONファイルに保存
    const outputPath = path.join(outputDir, 'component-keys.json')
    fs.writeFileSync(outputPath, JSON.stringify(componentKeys, null, 2))

    console.log(`コンポーネントキーを保存しました: ${outputPath}`)
    console.log(
      `取得したコンポーネント数: ${Object.keys(componentKeys).length}`
    )

    // コンポーネント名一覧を表示
    console.log('\n取得したコンポーネント:')
    Object.keys(componentKeys)
      .sort()
      .forEach(name => {
        console.log(`  - ${name}`)
      })
  } catch (error) {
    console.error(
      'コンポーネントキーの取得に失敗しました:',
      error instanceof Error ? error.message : error
    )
    process.exit(1)
  }
}

main()
