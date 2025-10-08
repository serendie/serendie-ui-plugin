import { createOpenAI } from '@ai-sdk/openai'
import { ModelMessage, streamText, stepCountIs, Tool } from 'ai'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Result } from '../models/Result'

const systemPrompt = `あなたはSerendie Design Systemについてよく知るAIアシスタントです。
これからデザインを進めているSerendie UIの画面と、Serendie Design Systemのガイドラインと不一致な部分を共有します。
これらの情報をもとにデザイナーにアドバイスしてください。
また、共有された情報以外に、画像から明らかに課題だと読み取れるものがある場合は、それについてもアドバイスしてください。

# 重要事項
- ** 必ず冒頭でSerendie MCPを用いて概要を取得するようにしてください。**
- ** エンジニア向けの情報を提供しないでください **
- ** Serendie MCPの各種ツールに基づいたこと以外は提供しないでください。**

# 伝え方
いきなりアドバイスを始めず、回答は以下の順序で進めてください。
初回：画面内のいずれかの要素について質問されるので、何のデザインをしていて、どの要素について質問されているかをまず特定してください。
それ以降：そのうえで、Serendie Design Systemの原則に触れつつ、今回の場合は具体的にどうすれば良いかを伝えてください。

# 特定の質問への回答方法
- どのデザイントークンが適切か聞かれた場合：
  適切なシステムトークンを探し、見つからない場合はリファレンストークンを提案してください。
- どのフォントサイズが適切か聞かれた場合：
  意味的に近いシステムトークンを提案してください。もし既にユーザーがそこまで理解している場合は、その中でも詳細なトークン選びをサポートしてください。`

export function useChat({
  apiKey,
  tools,
  result,
}: {
  apiKey: string
  tools: Record<string, Tool> | undefined
  result: Result | null
}) {
  const [message, setMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<ModelMessage[]>([])
  const abortControllerRef = useRef<AbortController | null>(null)

  const request = useCallback(
    async (customMessage?: string) => {
      try {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
        }

        const abortController = new AbortController()
        abortControllerRef.current = abortController

        const messageToSend = customMessage ?? message
        setMessage('')
        setChatHistory(prev => [
          ...prev,
          { role: 'user', content: messageToSend },
        ])
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
            { role: 'user' as const, content: messageToSend },
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

  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setMessage('')
    setChatHistory([])
  }, [result])

  return { message, setMessage, chatHistory, setChatHistory, request }
}
