import { createOpenAI } from '@ai-sdk/openai'
import { ModelMessage, streamText, stepCountIs, Tool } from 'ai'
import { useCallback, useRef, useState } from 'react'
import { getImageMetaKey, ImageMetas } from '../utils/getImageMetaKey'

const systemPrompt = `あなたはSerendie Design Systemについてよく知るAIアシスタントです。
これからデザインを進めているSerendie UIの画像と、Serendie Design Systemのガイドラインと一致しない部分を共有します。これらの情報をもとに、デザイナーからの質問に応えるようにアドバイスしてください。

# 利用可能なツールと使い分け
用途に応じて適切なツールを選択してください。

## 既存のSDS要素について質問された場合 → Serendie MCP + Serendie Design Docs Search API
- 既にSerendie Design Systemに定義されているコンポーネントやトークンについての質問
- 補足情報としてSerendie Design Docs Search APIも利用する
- 例：「Buttonコンポーネントの使い方は？」「このトークンの値は？」「SDSのガイドラインは？」

## 新規のSDS要素の設計について質問された場合 → Serendie Design Docs Search API
- まだSerendieに存在しない要素を新しく設計する際の参考情報
- **search-component-docs**: 新規コンポーネントの命名・設計パターンの参考（ARK UI, Component Gallery）
  - 例：「新しいコンポーネントの命名は？」「他のDSではこのパターンをどう実装している？」
- **search-design-token-docs**: 新規トークンの設計思想の参考（Material Design 3）
  - 例：「新しいトークンをどう設計すべき？」「この要素にはどのトークンを使用するべき？」

# 重要事項
- チャットの冒頭で、Serendie MCPの**get-serendie-ui-overview**をまず呼んでください
- もし情報ソースがある場合は、参考リンクを必ず提供してください
- 逆に情報ソースがない場合は、参考リンクなしでよいので、絶対に捏造しないでください
- エンジニア向けの情報は提供しないでください
- アドバイスは必ずツールから取得した情報に基づいてください

# 特定の質問への回答方法
- 既存のトークンについて聞かれた場合：
  Serendie MCPで適切なシステムトークンを探し、見つからない場合はリファレンストークンを提案してください。
  また、トークンの選び方はsearch-design-token-docsを参照して確認してください。
- 既存のコンポーネントについて聞かれた場合：
  Serendie MCPでコンポーネントの仕様やガイドラインを確認してください。
- 新規コンポーネントの設計について聞かれた場合：
  search-component-docsでSerendie UIが継承しているArk UIの事例や、他のデザインシステムの事例を参照してください。
- 新規トークンの設計について聞かれた場合：
  search-design-token-docsでSerendie UIが継承しているMaterial Design 3のデザイントークンの設計思想を参照してください。`

export function useChat({
  apiKey,
  tools,
}: {
  apiKey: string
  tools: Record<string, Tool> | undefined
}) {
  const [message, setMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<ModelMessage[]>([])
  const [imageMetas, setImageMetas] = useState<ImageMetas>({})
  const abortControllerRef = useRef<AbortController | null>(null)

  const clearChat = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setChatHistory([])
    setImageMetas({})
    setMessage('')
  }, [])

  const request = useCallback(
    async (
      customMessage?: string,
      images?: string[],
      imageLabels?: string[]
    ) => {
      try {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
        }

        const abortController = new AbortController()
        abortControllerRef.current = abortController

        const messageToSend = customMessage ?? message
        setMessage('')

        const userContent =
          images && images.length > 0
            ? [
                ...images.map(image => ({ type: 'image' as const, image })),
                { type: 'text' as const, text: messageToSend },
              ]
            : messageToSend

        const nextMessageIndex = chatHistory.length
        setChatHistory(prev => [
          ...prev,
          { role: 'user', content: userContent },
        ])

        if (imageLabels && imageLabels.length > 0) {
          setImageMetas(prev => {
            const newMetas = { ...prev }
            imageLabels.forEach((label, imageIndex) => {
              newMetas[getImageMetaKey(nextMessageIndex, imageIndex)] = label
            })
            return newMetas
          })
        }
        const openai = createOpenAI({ apiKey })
        const streamResult = streamText({
          model: openai('gpt-4.1'),
          tools,
          stopWhen: stepCountIs(10),
          abortSignal: abortController.signal,
          messages: [
            {
              role: 'system' as const,
              content: systemPrompt,
            },
            ...chatHistory.filter(({ role }) => role !== 'tool'),
            { role: 'user' as const, content: userContent },
          ],
        })
        let assistantMessage = ''
        for await (const part of streamResult.fullStream) {
          if (part.type === 'text-delta') {
            assistantMessage += part.text
            setChatHistory(prev => {
              const newHistory = [...prev]
              const lastMessage = newHistory[newHistory.length - 1]
              if (lastMessage && lastMessage.role === 'assistant') {
                lastMessage.content = assistantMessage
              } else {
                newHistory.push({
                  role: 'assistant',
                  content: assistantMessage,
                })
              }
              return newHistory
            })
          } else if (part.type === 'tool-call') {
            console.log(part.toolName, part.input)
          } else if (part.type === 'tool-result') {
            console.log(part.toolName, part.output)
            setChatHistory(prev => [
              ...prev,
              {
                role: 'tool' as const,
                content: [
                  {
                    type: 'tool-result' as const,
                    toolCallId: part.toolCallId,
                    toolName: part.toolName,
                    output: part.output,
                  },
                ],
              },
            ])
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('リクエストがキャンセルされました')
        } else {
          console.error('リクエストエラー:', error)
        }
      } finally {
        abortControllerRef.current = null
      }
    },
    [apiKey, message, chatHistory, tools]
  )

  return {
    message,
    setMessage,
    chatHistory,
    setChatHistory,
    imageMetas,
    clearChat,
    request,
  }
}
