import { createOpenAI } from '@ai-sdk/openai'
import { ModelMessage, streamObject } from 'ai'
import { Button, TextField } from '@serendie/ui'
import tokens from '@serendie/design-token'
import { SerendieSymbol } from '@serendie/symbols'
import { z } from 'zod'

import { Result } from '../App'
import { useCallback, useEffect, useState } from 'react'
import ClientStorage from '../../shared-src/models/ClientStorage'

const { sd } = tokens

interface ChatViewProps {
  result: Result | null
  onBack: () => void
}

export default function ChatView({ result, onBack }: ChatViewProps) {
  const [apiKey, setApiKey] = useState('')
  const [message, setMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<ModelMessage[]>([])
  const request = useCallback(async () => {
    try {
      setMessage('')
      setChatHistory(prev => [...prev, { role: 'user', content: message }])
      const openai = createOpenAI({ apiKey })
      const result = streamObject({
        model: openai('gpt-4.1'),
        schema: z.object({
          chat: z.string().describe('返答'),
        }),
        messages: [
          {
            role: 'system' as const,
            content: 'あなたはフレンドリーなアシスタントです。',
          },
          ...chatHistory,
          { role: 'user' as const, content: message },
        ],
      })
      for await (const part of result.partialObjectStream) {
        setChatHistory(prev => {
          if (part.chat === undefined) return prev

          const newHistory = [...prev]
          const lastMessage = newHistory[newHistory.length - 1]
          if (lastMessage.role === 'assistant') {
            lastMessage.content = part.chat
          } else {
            newHistory.push({ role: 'assistant', content: part.chat })
          }
          return newHistory
        })
      }
    } catch (error) {
      console.error(error)
    }
  }, [apiKey, message])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { type, value } = event.data.pluginMessage || {}
      if (type === 'storage-value') {
        setApiKey(value || '')
      }
    }
    window.addEventListener('message', handleMessage)
    parent.postMessage(
      {
        pluginMessage: {
          type: 'get-storage',
          key: ClientStorage.OPENAI_API_KEY,
        },
      },
      '*'
    )
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  useEffect(() => {
    setMessage('')
    setChatHistory([])
  }, [result])

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
          .filter(({ content }) => typeof content === 'string')
          .map(({ role, content }, index) => (
            <div
              key={index}
              style={{
                marginBottom: sd.system.dimension.spacing.medium,
                marginRight: role === 'user' ? 0 : 'auto',
                marginLeft: role === 'user' ? 'auto' : 0,
                width: 'fit-content',
                maxWidth: '80%',
                padding: `${sd.system.dimension.spacing.extraSmall} ${sd.system.dimension.spacing.small}`,
                borderRadius: sd.system.dimension.radius.medium,
                borderTopLeftRadius:
                  role === 'assistant' ? 0 : sd.system.dimension.radius.medium,
                borderTopRightRadius:
                  role === 'user' ? 0 : sd.system.dimension.radius.medium,
                backgroundColor:
                  role === 'user'
                    ? sd.system.color.impression.primary
                    : sd.system.color.component.surface,
              }}
            >
              <div
                style={{
                  ...sd.system.typography.body.medium_expanded,
                  color:
                    role === 'user'
                      ? sd.system.color.impression.onPrimary
                      : sd.system.color.component.onSurface,
                }}
              >
                {content as string}
              </div>
            </div>
          ))}
      </div>
      <div
        style={{
          padding: sd.system.dimension.spacing.large,
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
  )
}
