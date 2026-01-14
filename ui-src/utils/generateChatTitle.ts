import { createOpenAI } from '@ai-sdk/openai'
import { generateText, ModelMessage } from 'ai'

export const DEFAULT_CHAT_TITLE = '無題'
const TITLE_TARGET_LENGTH = 40
const TITLE_MAX_LENGTH = 30

function extractTextFromMessages(messages: ModelMessage[]): string {
  return messages
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => {
      const content = m.content
      const text =
        typeof content === 'string'
          ? content
          : Array.isArray(content)
            ? content.find(p => p.type === 'text')?.text || ''
            : ''
      return `${m.role === 'user' ? 'ユーザー' : 'アシスタント'}: ${text}`
    })
    .slice(0, 4) // 最初の4メッセージまで
    .join('\n')
}

export async function generateChatTitle(
  apiKey: string,
  messages: ModelMessage[]
): Promise<string> {
  const conversationText = extractTextFromMessages(messages)
  if (!conversationText) return DEFAULT_CHAT_TITLE

  try {
    const openai = createOpenAI({ apiKey })
    const result = await generateText({
      model: openai('gpt-4.1-mini'),
      messages: [
        {
          role: 'system',
          content: `以下の会話内容から、会話のタイトルを生成してください。タイトルは${TITLE_TARGET_LENGTH}文字以内の日本語で、会話の主題を簡潔に表すものにしてください。タイトルのみを出力し、それ以外は何も出力しないでください。`,
        },
        {
          role: 'user',
          content: conversationText,
        },
      ],
    })

    const title = result.text.trim()
    return title || DEFAULT_CHAT_TITLE
  } catch (error) {
    console.error('タイトル生成エラー:', error)
    const firstUserMessage = messages.find(m => m.role === 'user')
    if (firstUserMessage) {
      const content = firstUserMessage.content
      const text =
        typeof content === 'string'
          ? content
          : Array.isArray(content)
            ? content.find(p => p.type === 'text')?.text || ''
            : ''
      return (
        text.slice(0, TITLE_MAX_LENGTH) +
          (text.length > TITLE_MAX_LENGTH ? '...' : '') || DEFAULT_CHAT_TITLE
      )
    }
    return DEFAULT_CHAT_TITLE
  }
}
