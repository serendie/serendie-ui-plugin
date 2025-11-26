import { tool, Tool } from 'ai'
import { useMemo } from 'react'
import { z } from 'zod'

const API_ENDPOINT = 'https://main-production-a912.up.railway.app/api/search'

type SourceFilter = 'ark_ui' | 'component_gallery' | 'm3'

// NOTE: base64画像データを除外してトークン数を削減
function removeBase64Data(obj: unknown): unknown {
  if (typeof obj === 'string') {
    if (obj.startsWith('data:image/')) {
      return '[image data removed]'
    }
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(removeBase64Data)
  }

  if (obj && typeof obj === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      result[key] = removeBase64Data(value)
    }
    return result
  }

  return obj
}

async function searchDocs(
  query: string,
  sourceFilters: SourceFilter[],
  nResults: number = 5
): Promise<string> {
  const results = await Promise.all(
    sourceFilters.map(async sourceFilter => {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.DOCS_SEARCH_API_KEY || '',
        },
        body: JSON.stringify({
          query,
          n_results: nResults,
          source_filter: sourceFilter,
        }),
      })
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      return response.json()
    })
  )
  // base64画像データを除外
  const filteredResults = removeBase64Data(results.flat())
  return JSON.stringify(filteredResults)
}

const componentDocsParams = z.object({
  query: z.string().describe('コンポーネントの検索クエリ'),
  nResults: z
    .number()
    .optional()
    .default(5)
    .describe('返される結果の数 (デフォルト: 5)'),
})

const designTokenDocsParams = z.object({
  query: z.string().describe('デザイントークンの検索クエリ'),
  nResults: z
    .number()
    .optional()
    .default(5)
    .describe('返される結果の数 (デフォルト: 5)'),
})

export function useDocsSearchTools(): Record<string, Tool> {
  const searchComponentDocs = useMemo(() => {
    return tool({
      description: `コンポーネントの命名や設計のヒントになる参考資料を検索します。
新規コンポーネントの命名や設計、既存コンポーネントのパターンを理解する際に活用してください。`,
      inputSchema: componentDocsParams,
      execute: async ({
        query,
        nResults,
      }: z.infer<typeof componentDocsParams>) => {
        return await searchDocs(
          query,
          ['ark_ui', 'component_gallery'],
          nResults
        )
      },
    })
  }, [])

  const searchDesignTokenDocs = useMemo(() => {
    return tool({
      description: `デザイントークンの使用法とデザイン原則を検索します。
デザイントークンの使用方法を検討・精査するときに使用してください。`,
      inputSchema: designTokenDocsParams,
      execute: async ({
        query,
        nResults,
      }: z.infer<typeof designTokenDocsParams>) => {
        return await searchDocs(query, ['m3'], nResults)
      },
    })
  }, [])

  return {
    searchComponentDocs,
    searchDesignTokenDocs,
  }
}
