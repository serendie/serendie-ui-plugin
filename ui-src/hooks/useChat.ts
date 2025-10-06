import { createOpenAI } from '@ai-sdk/openai'
import { ModelMessage, streamText, stepCountIs, Tool } from 'ai'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Result } from '../App'

interface UseChatProps {
  apiKey: string
  tools: Record<string, Tool> | undefined
  result: Result | null
}

export function useChat({ apiKey, tools, result }: UseChatProps) {
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
        const result = streamText({
          model: openai('gpt-4.1'),
          tools,
          stopWhen: stepCountIs(10),
          abortSignal: abortController.signal,
          messages: [
            {
              role: 'system' as const,
              content: 'あなたはフレンドリーなアシスタントです。',
            },
            ...chatHistory.filter(({ role }) => role !== 'tool'),
            { role: 'user' as const, content: messageToSend },
          ],
        })
        let assistantMessage = ''
        for await (const part of result.fullStream) {
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
