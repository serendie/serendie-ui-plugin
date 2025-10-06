import { createOpenAI } from '@ai-sdk/openai'
import {
  ModelMessage,
  streamText,
  experimental_createMCPClient as createMCPClient,
  stepCountIs,
  Tool,
  ToolContent,
} from 'ai'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { useCallback, useEffect, useState } from 'react'
import { Button, TextField } from '@serendie/ui'
import tokens from '@serendie/design-token'
import { SerendieSymbol } from '@serendie/symbols'

import { Result } from '../App'
import ChatMessage from './ChatMessage'
import { useApiKey } from '../hooks/useApiKey'
import getToolDescription from '../utils/getToolDescription'

const { sd } = tokens

interface ChatViewProps {
  result: Result | null
  onBack: () => void
}

export default function ChatView({ result, onBack }: ChatViewProps) {
  const { apiKey } = useApiKey()
  const [message, setMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<ModelMessage[]>([])
  const [tools, setTools] = useState<Record<string, Tool> | undefined>(
    undefined
  )
  const [selectionImage, setSelectionImage] = useState<string | null>(null)
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
  }, [apiKey, message, chatHistory, tools, selectionImage])

  useEffect(() => {
    setMessage('')
    setChatHistory([])
    setSelectionImage(null)
    parent.postMessage({ pluginMessage: { type: 'get-selection-image' } }, '*')
  }, [result])

  useEffect(() => {
    const init = async () => {
      try {
        const mcp = await createMCPClient({
          transport: new StreamableHTTPClientTransport(
            new URL('https://serendie.design/mcp')
          ),
        })
        const tools = await mcp.tools()
        setTools(tools)
      } catch (error) {
        console.error('MCP初期化エラー:', error)
      }
    }
    init()
  }, [])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const msg = event.data.pluginMessage
      if (msg?.type === 'selection-image') {
        setSelectionImage(msg.image)
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: sd.reference.typography.fontFamily.primary,
        backgroundColor: sd.system.color.impression.tertiary,
      }}
    >
      <div
        style={{
          padding: sd.system.dimension.spacing.extraSmall,
        }}
      >
        <Button
          leftIcon={<SerendieSymbol name='chevron-left' />}
          size='small'
          styleType='ghost'
          onClick={onBack}
        >
          戻る
        </Button>
        <p
          style={{
            textAlign: 'center',
            ...sd.system.typography.label.medium_expanded,
            color: sd.system.color.component.onSurfaceVariant,
            position: 'absolute',
            top: 24,
            left: '50%',
            transform: 'translate(-50%, -50%)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '14em',
          }}
        >
          {result?.name}
        </p>
        <div style={{ width: 60 }} />
      </div>
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: sd.system.dimension.spacing.large,
        }}
      >
        {chatHistory
          .filter(
            ({ role }) =>
              role === 'user' || role === 'assistant' || role === 'tool'
          )
          .map(({ role, content }, index) => {
            if (role === 'tool') {
              const toolContent = content as ToolContent
              if (toolContent?.[0].toolName) {
                return (
                  <p
                    key={index}
                    style={{
                      ...sd.system.typography.label.small_expanded,
                      color: sd.system.color.component.onSurfaceVariant,
                      marginBottom: sd.system.dimension.spacing.twoExtraSmall,
                      padding: `${sd.system.dimension.spacing.small} 0`,
                    }}
                  >
                    {getToolDescription(toolContent[0].toolName)}
                  </p>
                )
              }
            }

            const textContent = Array.isArray(content)
              ? content.find(part => part.type === 'text')?.text || ''
              : (content as string)

            const imagePart = Array.isArray(content)
              ? content.find(part => part.type === 'image')
              : undefined

            const imageContent =
              imagePart && typeof imagePart.image === 'string'
                ? imagePart.image
                : undefined

            return (
              <ChatMessage
                key={index}
                role={role as 'user' | 'assistant'}
                content={textContent}
                image={imageContent}
              />
            )
          })}
      </div>
      <div
        style={{
          padding: sd.system.dimension.spacing.large,
          display: 'flex',
          flexDirection: 'column',
          gap: sd.system.dimension.spacing.medium,
        }}
      >
        {selectionImage && (
          <div
            style={{
              position: 'relative',
              display: 'inline-block',
              alignSelf: 'flex-start',
              maxWidth: '200px',
            }}
          >
            <img
              src={selectionImage}
              alt='選択中のフレーム'
              style={{
                maxWidth: '100%',
                borderRadius: sd.system.dimension.radius.medium,
                border: `1px solid ${sd.system.color.component.outlineVariant}`,
              }}
            />
            <button
              onClick={() => setSelectionImage(null)}
              style={{
                position: 'absolute',
                top: sd.system.dimension.spacing.twoExtraSmall,
                right: sd.system.dimension.spacing.twoExtraSmall,
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: sd.system.color.component.surface,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>
          </div>
        )}
        <div
          style={{
            display: 'flex',
            gap: sd.system.dimension.spacing.medium,
            alignItems: 'center',
          }}
        >
          <TextField
            placeholder='メッセージを入力'
            style={{ flex: 1 }}
            value={message}
            onChange={e => {
              if (e.target instanceof HTMLInputElement) {
                setMessage(e.target.value)
              }
            }}
            onKeyDown={e => {
              if (
                e.key === 'Enter' &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing
              ) {
                e.preventDefault()
                if (message.trim() != '') request()
              }
            }}
          />
          <Button
            style={{ flexShrink: 0 }}
            disabled={message.trim() === ''}
            onClick={() => {
              if (message.trim() != '') request()
            }}
          >
            送信
          </Button>
        </div>
      </div>
    </div>
  )
}
