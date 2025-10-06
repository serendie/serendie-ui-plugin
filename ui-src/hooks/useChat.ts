import { createOpenAI } from '@ai-sdk/openai'
import { ModelMessage, streamText, stepCountIs, Tool } from 'ai'
import { useCallback, useEffect, useState } from 'react'
import { Result } from '../App'

interface UseChatProps {
  apiKey: string
  tools: Record<string, Tool> | undefined
  result: Result | null
  selectionImage: string | null
  setSelectionImage: (image: string | null) => void
}

export function useChat({
  apiKey,
  tools,
  result,
  selectionImage,
  setSelectionImage,
}: UseChatProps) {
  const [message, setMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<ModelMessage[]>([])

  const request = useCallback(async () => {
    try {
      setMessage('')
      const userContent = selectionImage
        ? [
            { type: 'image' as const, image: selectionImage },
            { type: 'text' as const, text: message },
          ]
        : message
      setChatHistory(prev => [...prev, { role: 'user', content: userContent }])
      const openai = createOpenAI({ apiKey })
      const result = streamText({
        model: openai('gpt-4.1'),
        tools,
        stopWhen: stepCountIs(10),
        messages: [
          {
            role: 'system' as const,
            content: 'あなたはフレンドリーなアシスタントです。',
          },
          ...chatHistory.filter(({ role }) => role !== 'tool'),
          { role: 'user' as const, content: userContent },
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
              newHistory.push({ role: 'assistant', content: assistantMessage })
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
      console.error('リクエストエラー:', error)
    } finally {
      setSelectionImage(null)
    }
  }, [apiKey, message, chatHistory, tools, selectionImage, setSelectionImage])

  useEffect(() => {
    setMessage('')
    setChatHistory([])
  }, [result])

  return { message, setMessage, chatHistory, request }
}
