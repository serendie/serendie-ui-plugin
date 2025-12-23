import { createOpenAI } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { useCallback, useEffect, useRef, useState } from 'react'
import { z } from 'zod'
import { SelectionInfo } from '../../shared-src/models/PluginMessage'
import { SelectionImageItem } from './useSelectionImages'

const questionSchema = z.object({
  questions: z
    .array(z.string())
    .length(2)
    .describe('ユーザーに提案する質問候補を2つ'),
})

export function useQuestions({
  apiKey,
  selections,
  getSelectionImages,
  hasChat,
}: {
  apiKey: string
  selections: SelectionInfo[]
  getSelectionImages: (
    selections: SelectionInfo[]
  ) => Promise<SelectionImageItem[]>
  hasChat: boolean
}) {
  const [questions, setQuestions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const clearQuestions = useCallback(() => {
    setQuestions([])
  }, [])

  useEffect(() => {
    // 前のリクエストをキャンセル
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    if (!apiKey || selections.length === 0) {
      setQuestions([])
      setIsLoading(false)
      return
    }

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    const generateQuestions = async () => {
      setIsLoading(true)
      setQuestions([])

      try {
        const items = await getSelectionImages(selections)

        // キャンセルされていたら終了
        if (abortController.signal.aborted) return

        if (items.length === 0) {
          setQuestions([])
          setIsLoading(false)
          return
        }

        const openai = createOpenAI({ apiKey })

        const promptText = `あなたはSerendie Design Systemを設計するデザイナーのアシスタントです。
添付画像は、デザイン途中の画面またはコンポーネントのスクリーンショットです。
添付画像をもとに、デザイナーが何に悩んでAIに相談しようとしているかを推定してください。
そして、推定した結果をもとにAIに向けた質問文を作ってください。

作る質問文は2つ、各質問はですます調で、40文字以内の簡潔な表現にしてください。`

        const { object } = await generateObject({
          model: openai('gpt-4o-mini'),
          schema: questionSchema,
          messages: [
            {
              role: 'user',
              content: [
                ...items.map(item => ({
                  type: 'image' as const,
                  image: item.image,
                })),
                { type: 'text', text: promptText },
              ],
            },
          ],
          abortSignal: abortController.signal,
        })

        // キャンセルされていたら結果を反映しない
        if (abortController.signal.aborted) return

        setQuestions(object.questions)
      } catch (error) {
        // キャンセルによるエラーは無視
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }
        console.error('質問生成エラー:', error)
        setQuestions([])
      } finally {
        // キャンセルされていなければローディング終了
        if (!abortController.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    generateQuestions()

    // クリーンアップ
    return () => {
      abortController.abort()
    }
  }, [apiKey, selections, getSelectionImages, hasChat])

  return { questions, isLoading, clearQuestions }
}
