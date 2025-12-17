import { createOpenAI } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { useCallback, useEffect, useRef, useState } from 'react'
import { z } from 'zod'
import { SelectionInfo } from '../../shared-src/models/PluginMessage'

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
  ) => Promise<{ images: string[]; labels: string[] }>
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
        const { images } = await getSelectionImages(selections)

        // キャンセルされていたら終了
        if (abortController.signal.aborted) return

        if (images.length === 0) {
          setQuestions([])
          setIsLoading(false)
          return
        }

        const openai = createOpenAI({ apiKey })

        const promptText = hasChat
          ? `あなたはSerendie Design Systemのアシスタントです。
画面のスクリーンショットを見て、ユーザーが次に聞きたくなりそうな質問を2つ生成してください。
会話の続きとして自然な質問にしてください。
各質問はですます調で、40文字以内の簡潔な表現にしてください。`
          : `あなたはSerendie Design Systemを設計するデザイナーのアシスタントです。
選択中の要素のスクリーンショットを見て、デザイナーがこの要素の何に悩んでいるか推定してください。
そして、推定した結果をもとに、ベテランデザイナーに投げかけるための質問文にしてください。

生成する質問文は2つ、各質問はですます調で、40文字以内の簡潔な表現にしてください。

なお、選択される要素は以下のいずれかが想定されます。
- SDSにまだない、設計途中の新しいコンポーネント
- 既存コンポーネントを組み合わせて制作中の画面`

        const { object } = await generateObject({
          model: openai('gpt-4o-mini'),
          schema: questionSchema,
          messages: [
            {
              role: 'user',
              content: [
                ...images.map(image => ({ type: 'image' as const, image })),
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
