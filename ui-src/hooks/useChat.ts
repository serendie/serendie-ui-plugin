import { createOpenAI } from '@ai-sdk/openai'
import { ModelMessage, streamText, stepCountIs, Tool } from 'ai'
import { useCallback, useRef, useState } from 'react'
import { getImageMetaKey, ImageMetas } from '../utils/getImageMetaKey'
import { FIGMA_NODE_SCHEME } from '../components/chat/MarkdownRenderer'
import { SelectionImageItem } from './useSelectionImages'

const systemPrompt = `あなたはSerendie Design System（以後、SDS）についてよく知るAIアシスタントです。
デザイナーからの質問に対して、適切なツールを使って情報を収集し、具体的で実践的なアドバイスを提供してください。

# 利用可能なツール（複数同時に使うことも可）

## チャットの冒頭（最重要）
- **get-serendie-ui-overview**：**必ず**会話の冒頭でSDSの概要を取得してください

## 選択中の要素のデザインまたはバリアントについて質問された場合 → 検証ツール + Serendie MCP
- **run-linter**: 選択中の要素がSDSのガイドラインに沿っているか、どのような構成でどんなバリアントが使用されているかの検証を行えます
  - 例：「このボタンの色は正しい？」「デザイントークンは適切に使われている？」「バリアントの名前は適切ですか？」
- 検証はガイドラインの一部のみで完璧なものではないため、必ず他のツールと合わせて使用してください
- 選択中の要素の構成・デザイン（色・サイズなど）・バリアントの設計も同時に把握できます

## 選択中の要素が、SDSにない新規のコンポーネントまたはトークンを含む場合 → Serendie Design Docs Search API
- **search-component-docs**: 新規コンポーネントの命名・設計パターンの参考（ARK UI, Component Gallery）
  - 例：「新しいコンポーネントの命名は？」「他のDSではこのパターンをどう実装している？」「バリアントの過不足を知りたいです」
- **search-design-token-docs**: 新規トークンの設計思想の参考（Material Design 3）
  - 例：「新しいトークンをどう設計すべき？」「この要素にはどのトークンを使用するべき？」

## 選択中の要素が、SDSで定義されたコンポーネントまたはトークンを含む場合 → Serendie MCP + Serendie Design Docs Search API
- **search-serendie-guideline**: SDSの設計思想や設計パターンの参考
  - 例：「Buttonコンポーネントの使い方は？」「このトークンの値は？」「SDSのガイドラインではどのような指定がある？」
- もしガイドラインが見つからない場合は、SDSにない新規要素としてSerendie Design Docs Search APIを利用してください
- もしガイドラインが見つかった場合も、補足情報としてSerendie Design Docs Search APIを同時に利用してください

# 重要事項
- もし情報ソースがある場合は、参考リンクを必ず提供してください
- 逆に情報ソースがない場合は、参考リンクなしでよいので、絶対に捏造しないでください
- アドバイスは必ずツールから取得した情報に基づいてください
- エンジニア向けの情報は提供しないでください

# Figma要素へのリンク
デザイン要素について言及する際、ユーザーがその要素に素早くジャンプできるよう、以下の形式でリンクを張ってください：
- 形式: \`[要素名](${FIGMA_NODE_SCHEME}ノードID)\`
- 例: \`[メインボタン](${FIGMA_NODE_SCHEME}123:456)\`のカラーを確認してください
- ノードIDは、検証結果の構造情報（例: [123:456] Button）から取得できます
- すべての要素にリンクを張る必要はありません。指摘や提案の対象となる要素にのみリンクを張ってください`

export function useChat({
  apiKey,
  tools,
  onComplete,
}: {
  apiKey: string
  tools: Record<string, Tool> | undefined
  onComplete?: (messages: ModelMessage[], imageMetas: ImageMetas) => void
}) {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<ModelMessage[]>([])
  const [imageMetas, setImageMetas] = useState<ImageMetas>({})
  const [isStreaming, setIsStreaming] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const messagesRef = useRef(messages)
  const imageMetasRef = useRef(imageMetas)
  messagesRef.current = messages
  imageMetasRef.current = imageMetas

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [])

  const clearChat = useCallback(() => {
    abort()
    setMessages([])
    setImageMetas({})
    setMessage('')
  }, [abort])

  const request = useCallback(
    async (customMessage?: string, imageItems?: SelectionImageItem[]) => {
      try {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
        }

        const abortController = new AbortController()
        abortControllerRef.current = abortController
        setIsStreaming(true)

        const messageToSend = customMessage ?? message
        setMessage('')

        const userContent =
          imageItems && imageItems.length > 0
            ? [
                ...imageItems.map(item => ({
                  type: 'image' as const,
                  image: item.image,
                })),
                { type: 'text' as const, text: messageToSend },
              ]
            : messageToSend

        // システムプロンプトにノード情報を追加
        let systemPromptWithContext = systemPrompt
        if (imageItems && imageItems.length > 0) {
          const nodeInfo = imageItems
            .map(item => `- ${item.label} (ID: ${item.nodeId})`)
            .join('\n')
          systemPromptWithContext = `${systemPrompt}\n\n# 現在選択中のノード\n${nodeInfo}`
        }

        const nextMessageIndex = messages.length
        setMessages(prev => [...prev, { role: 'user', content: userContent }])

        if (imageItems && imageItems.length > 0) {
          setImageMetas(prev => {
            const newMetas = { ...prev }
            imageItems.forEach((item, imageIndex) => {
              newMetas[getImageMetaKey(nextMessageIndex, imageIndex)] = item
            })
            return newMetas
          })
        }
        const openai = createOpenAI({ apiKey })
        const streamResult = streamText({
          model: openai('gpt-5.2-codex'),
          tools,
          stopWhen: stepCountIs(10),
          abortSignal: abortController.signal,
          messages: [
            {
              role: 'system' as const,
              content: systemPromptWithContext,
            },
            ...messages,
            { role: 'user' as const, content: userContent },
          ],
        })
        let assistantMessage = ''
        for await (const part of streamResult.fullStream) {
          if (part.type === 'text-delta') {
            assistantMessage += part.text
            setMessages(prev => {
              const newHistory = [...prev]
              const lastMessage = newHistory[newHistory.length - 1]
              if (lastMessage && lastMessage.role === 'assistant') {
                if (Array.isArray(lastMessage.content)) {
                  // 配列形式の場合は、text部分だけを更新
                  const textPartIndex = lastMessage.content.findIndex(
                    p => p.type === 'text'
                  )
                  if (textPartIndex !== -1) {
                    lastMessage.content[textPartIndex] = {
                      type: 'text' as const,
                      text: assistantMessage,
                    }
                  } else {
                    // text部分がない場合は先頭に追加
                    lastMessage.content.unshift({
                      type: 'text' as const,
                      text: assistantMessage,
                    })
                  }
                } else {
                  // 文字列形式の場合はそのまま更新
                  lastMessage.content = assistantMessage
                }
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
            setMessages(prev => {
              const newHistory = [...prev]
              const lastMessage = newHistory[newHistory.length - 1]
              if (lastMessage && lastMessage.role === 'assistant') {
                const content = Array.isArray(lastMessage.content)
                  ? lastMessage.content
                  : [{ type: 'text' as const, text: lastMessage.content }]
                lastMessage.content = [
                  ...content,
                  {
                    type: 'tool-call' as const,
                    toolCallId: part.toolCallId,
                    toolName: part.toolName,
                    input: part.input,
                  },
                ]
              } else {
                newHistory.push({
                  role: 'assistant',
                  content: [
                    {
                      type: 'tool-call' as const,
                      toolCallId: part.toolCallId,
                      toolName: part.toolName,
                      input: part.input,
                    },
                  ],
                })
              }
              return newHistory
            })
          } else if (part.type === 'tool-result') {
            console.log(part.toolName, part.output)
            setMessages(prev => [
              ...prev,
              {
                role: 'tool' as const,
                content: [
                  {
                    type: 'tool-result' as const,
                    toolCallId: part.toolCallId,
                    toolName: part.toolName,
                    output:
                      typeof part.output === 'string'
                        ? { type: 'text' as const, value: part.output }
                        : { type: 'json' as const, value: part.output },
                  },
                ],
              },
            ])
          }
        }
        onComplete?.(messagesRef.current, imageMetasRef.current)
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('リクエストがキャンセルされました')
        } else {
          console.error('リクエストエラー:', error)
        }
      } finally {
        abortControllerRef.current = null
        setIsStreaming(false)
      }
    },
    [apiKey, message, messages, tools, onComplete]
  )

  return {
    message,
    setMessage,
    messages,
    setMessages,
    imageMetas,
    setImageMetas,
    clearChat,
    request,
    abort,
    isStreaming,
  }
}
