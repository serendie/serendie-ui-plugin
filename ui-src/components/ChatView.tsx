import { createOpenAI } from '@ai-sdk/openai'
import { streamObject } from 'ai'
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
  const request = useCallback(async () => {
    try {
      setMessage('')
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
          { role: 'user' as const, content: message },
        ],
      })
      for await (const part of result.partialObjectStream) {
        console.log(part)
      }
      const obj = await result.object
      console.log(obj)
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
          padding: sd.system.dimension.spacing.threeExtraLarge,
        }}
      >
        <div
          style={{
            ...sd.system.typography.body.large_expanded,
            color: sd.system.color.component.onSurfaceVariant,
            textAlign: 'center',
            marginTop: sd.system.dimension.spacing.fourExtraLarge,
          }}
        >
          チャット機能は準備中です
        </div>
        <div
          style={{
            ...sd.system.typography.body.medium_expanded,
            color: sd.system.color.component.onSurfaceVariant,
            textAlign: 'center',
            marginTop: sd.system.dimension.spacing.large,
          }}
        >
          検証結果: {result?.issues.length ?? 0}件のissue
        </div>
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
            if (e.key === 'Enter' && !e.shiftKey) {
              request()
            }
          }}
        />
        <Button style={{ flexShrink: 0 }} onClick={request}>
          送信
        </Button>
      </div>
    </div>
  )
}
