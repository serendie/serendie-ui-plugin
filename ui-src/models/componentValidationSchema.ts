import { z } from 'zod'

// AIが返すコンポーネント候補のスキーマ
export const componentCandidateSchema = z.object({
  nodeId: z.string().describe('対象ノードのID'),
  suggestedComponent: z.string().describe('推奨されるSDSコンポーネント名'),
  properties: z
    .record(z.union([z.string(), z.boolean(), z.number()]))
    .optional()
    .describe(
      '推奨されるコンポーネントプロパティ（例: { "size": "medium", "ShowIcon": true }）'
    ),
  confidence: z.enum(['high', 'medium', 'low']).describe('推定の確信度'),
  reason: z.string().describe('判断理由'),
})

// AIレスポンス全体のスキーマ
export const componentValidationResponseSchema = z.object({
  candidates: z.array(componentCandidateSchema),
})

export type ComponentCandidate = z.infer<typeof componentCandidateSchema>
export type ComponentValidationResponse = z.infer<
  typeof componentValidationResponseSchema
>

export function filterValidCandidates(
  rawCandidates: unknown[]
): ComponentCandidate[] {
  const valid: ComponentCandidate[] = []
  for (const item of rawCandidates) {
    const result = componentCandidateSchema.safeParse(item)
    if (result.success) {
      valid.push(result.data)
    } else {
      console.warn('Invalid candidate filtered out:', item)
    }
  }
  return valid
}
