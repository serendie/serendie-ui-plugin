import { createOpenAI } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { useEffect, useState } from 'react'
import { z } from 'zod'
import { Result, serializeResult } from '../models/Result'

const questionSchema = z.object({
  questions: z
    .array(z.string())
    .length(2)
    .describe('ユーザーに提案する質問候補を3つ'),
})

export function useQuestions({
  apiKey,
  result,
  imageData,
}: {
  apiKey: string
  result: Result | null
  imageData?: string
}) {
  const [questions, setQuestions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const generateQuestions = async () => {
      if (!imageData || !apiKey) return

      setIsLoading(true)
      try {
        const openai = createOpenAI({ apiKey })

        const { object } = await generateObject({
          model: openai('gpt-4o-mini'),
          schema: questionSchema,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'image', image: imageData },
                {
                  type: 'text',
                  text: `あなたはSerendie Design Systemのアシスタントです。
画面のスクリーンショットと検証結果を見て、デザイナーが次に聞きたくなりそうな質問を2つ生成してください。
各質問はですます調で、40文字以内の簡潔な表現にしてください。

- 1つ目の質問は、検証結果に基づいて、デザイナーが実際に改善に取り組む際に役立つ具体的なものにしてください
- 2つ目の質問は、検証結果以外で、画像から読み取れる課題に基づいたものにしてください

検証結果: ${result ? serializeResult(result) : 'なし'}`,
                },
              ],
            },
          ],
        })

        setQuestions(object.questions)
      } catch (error) {
        console.error('質問生成エラー:', error)
        setQuestions([])
      } finally {
        setIsLoading(false)
      }
    }

    generateQuestions()
  }, [apiKey, result, imageData])

  return { questions, isLoading }
}
