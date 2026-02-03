import { useCallback, useEffect, useRef, useState } from 'react'
import { ModelMessage } from 'ai'
import ClientStorage from '../../shared-src/models/ClientStorage'
import { ChatSession } from '../models/ChatSession'
import { ImageMetas } from '../utils/getImageMetaKey'
import {
  generateChatTitle,
  DEFAULT_CHAT_TITLE,
} from '../utils/generateChatTitle'

export const MAX_SESSIONS = 20
export const MAX_SESSION_SIZE = 1.25 * 1024 * 1024 // 1.25MB
export const IMAGE_REMOVED_PLACEHOLDER = '[IMAGE_REMOVED_DUE_TO_SIZE_LIMIT]'

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

// imageMetasから画像データを除外してラベル情報のみ保持
function stripImageData(imageMetas: ImageMetas): ImageMetas {
  const stripped: ImageMetas = {}
  for (const [key, value] of Object.entries(imageMetas)) {
    stripped[key] = {
      ...value,
      image: '', // 画像データは保存しない
    }
  }
  return stripped
}

// 容量超過時に古いセッションを削除
function trimOldestSession(sessions: ChatSession[]): ChatSession[] {
  if (sessions.length === 0) return sessions
  // 一番古いセッション（末尾）を削除
  return sessions.slice(0, -1)
}

// メッセージ内の古い画像から順に削除してサイズを制限内に収める
function trimSessionImages(
  messages: ModelMessage[],
  maxSize: number
): { messages: ModelMessage[]; trimmed: boolean } {
  let trimmed = false
  let currentMessages = [...messages]

  // サイズが制限内になるまで古い画像から削除
  while (JSON.stringify(currentMessages).length > maxSize) {
    // 古いメッセージから順に画像を探す
    let removed = false
    for (let i = 0; i < currentMessages.length; i++) {
      const msg = currentMessages[i]
      if (msg.role !== 'user' || !Array.isArray(msg.content)) continue

      // このメッセージ内に削除可能な画像があるか
      const imageIndex = msg.content.findIndex(
        part =>
          part.type === 'image' &&
          typeof part.image === 'string' &&
          part.image !== IMAGE_REMOVED_PLACEHOLDER
      )

      if (imageIndex !== -1) {
        // 画像をプレースホルダーに置き換え
        const newContent = msg.content.map((part, idx) => {
          if (idx === imageIndex && part.type === 'image') {
            return { type: 'image' as const, image: IMAGE_REMOVED_PLACEHOLDER }
          }
          return part
        })
        currentMessages = [
          ...currentMessages.slice(0, i),
          { ...msg, content: newContent },
          ...currentMessages.slice(i + 1),
        ]
        trimmed = true
        removed = true
        console.log(`容量制限: メッセージ[${i}]の画像を削除しました`)
        break
      }
    }

    // 削除できる画像がなければループを抜ける
    if (!removed) break
  }

  return { messages: currentMessages, trimmed }
}

export function useChatSessions(apiKey: string) {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const pendingSaveRef = useRef<ChatSession[] | null>(null)

  // セッション一覧を読み込み
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { type, key, value } = event.data.pluginMessage || {}

      if (type === 'storage-value' && key === ClientStorage.CHAT_SESSIONS) {
        const loadedSessions: ChatSession[] = value || []
        // 新しい順にソート
        loadedSessions.sort((a, b) => b.updatedAt - a.updatedAt)
        setSessions(loadedSessions)
        setIsLoading(false)
      }

      if (type === 'storage-saved' && key === ClientStorage.CHAT_SESSIONS) {
        pendingSaveRef.current = null
        // 保存後に再読み込み
        parent.postMessage(
          {
            pluginMessage: {
              type: 'get-storage',
              key: ClientStorage.CHAT_SESSIONS,
            },
          },
          '*'
        )
      }

      if (
        type === 'storage-save-failed' &&
        key === ClientStorage.CHAT_SESSIONS
      ) {
        // 保存失敗時：古いセッションを削除してリトライ
        if (pendingSaveRef.current && pendingSaveRef.current.length > 0) {
          const trimmed = trimOldestSession(pendingSaveRef.current)
          console.log(`ストレージ容量超過: 古いセッションを削除しました（残り${trimmed.length}件）`)
          if (trimmed.length > 0) {
            pendingSaveRef.current = trimmed
            parent.postMessage(
              {
                pluginMessage: {
                  type: 'set-storage',
                  key: ClientStorage.CHAT_SESSIONS,
                  value: trimmed,
                },
              },
              '*'
            )
          } else {
            pendingSaveRef.current = null
            figma.notify('履歴の保存に失敗しました', { error: true })
          }
        }
      }
    }

    window.addEventListener('message', handleMessage)
    parent.postMessage(
      {
        pluginMessage: {
          type: 'get-storage',
          key: ClientStorage.CHAT_SESSIONS,
        },
      },
      '*'
    )

    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // セッションを保存（容量超過時は画像を削除して再試行）
  const saveSession = useCallback(
    async (messages: ModelMessage[], imageMetas: ImageMetas) => {
      if (messages.length === 0) return null

      // imageMetasから画像データを除外（ラベル情報のみ保持）
      const strippedImageMetas = stripImageData(imageMetas)

      // セッションサイズが制限を超える場合、古い画像から削除
      const { messages: trimmedMessages } = trimSessionImages(
        messages,
        MAX_SESSION_SIZE
      )

      const now = Date.now()
      let session: ChatSession

      if (currentSessionId) {
        // 既存セッション: タイトルは維持
        const existing = sessions.find(s => s.id === currentSessionId)
        session = {
          id: currentSessionId,
          title: existing?.title ?? DEFAULT_CHAT_TITLE,
          messages: trimmedMessages,
          imageMetas: strippedImageMetas,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
        }
      } else {
        // 新規セッション: AIでタイトル生成
        const newId = generateId()
        const title = apiKey
          ? await generateChatTitle(apiKey, messages)
          : DEFAULT_CHAT_TITLE
        session = {
          id: newId,
          title,
          messages: trimmedMessages,
          imageMetas: strippedImageMetas,
          createdAt: now,
          updatedAt: now,
        }
        setCurrentSessionId(newId)
      }

      // 現在のセッションを追加・更新
      let updatedSessions = sessions.filter(s => s.id !== session.id)
      updatedSessions = [session, ...updatedSessions]

      // 古いセッションを削除
      if (updatedSessions.length > MAX_SESSIONS) {
        updatedSessions = updatedSessions.slice(0, MAX_SESSIONS)
      }

      // リトライ用に保持
      pendingSaveRef.current = updatedSessions

      // 保存を試行
      parent.postMessage(
        {
          pluginMessage: {
            type: 'set-storage',
            key: ClientStorage.CHAT_SESSIONS,
            value: updatedSessions,
          },
        },
        '*'
      )

      return session.id
    },
    [apiKey, sessions, currentSessionId]
  )

  // セッションを読み込み
  const loadSession = useCallback(
    (
      sessionId: string
    ): { messages: ModelMessage[]; imageMetas: ImageMetas } | null => {
      const session = sessions.find(s => s.id === sessionId)
      if (!session) return null

      setCurrentSessionId(sessionId)
      return {
        messages: session.messages,
        imageMetas: session.imageMetas,
      }
    },
    [sessions]
  )

  // セッションを削除
  const deleteSession = useCallback(
    (sessionId: string) => {
      const updatedSessions = sessions.filter(s => s.id !== sessionId)

      if (currentSessionId === sessionId) {
        setCurrentSessionId(null)
      }

      parent.postMessage(
        {
          pluginMessage: {
            type: 'set-storage',
            key: ClientStorage.CHAT_SESSIONS,
            value: updatedSessions,
          },
        },
        '*'
      )
    },
    [sessions, currentSessionId]
  )

  // 新規セッションを開始
  const startNewSession = useCallback(() => {
    setCurrentSessionId(null)
  }, [])

  return {
    sessions,
    currentSessionId,
    isLoading,
    saveSession,
    loadSession,
    deleteSession,
    startNewSession,
  }
}
