import { z } from 'zod'

// AIが返すコンポーネント候補のスキーマ
export const componentCandidateSchema = z.object({
  nodeId: z.string().describe('対象ノードのID'),
  suggestedComponent: z
    .string()
    .nullable()
    .describe('推奨されるSDSコンポーネント名（該当なしの場合はnull）'),
  confidence: z
    .enum(['high', 'medium', 'low'])
    .describe('推定の確信度'),
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
