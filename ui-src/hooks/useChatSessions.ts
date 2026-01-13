import { useCallback, useEffect, useRef, useState } from 'react'
import { ModelMessage } from 'ai'
import ClientStorage from '../../shared-src/models/ClientStorage'
import { ChatSession } from '../models/ChatSession'
import { ImageMetas } from '../utils/getImageMetaKey'
import {
  generateChatTitle,
  DEFAULT_CHAT_TITLE,
} from '../utils/generateChatTitle'

const MAX_SESSIONS = 20
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024 // 1セッションあたりの画像最大2MB

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

// imageMetasのサイズを計算（バイト単位）
function getImageMetasSize(imageMetas: ImageMetas): number {
  return new Blob([JSON.stringify(imageMetas)]).size
}

// セッションから画像を削除してサイズを制限
function trimSessionImages(
  imageMetas: ImageMetas,
  maxSize: number
): ImageMetas {
  const size = getImageMetasSize(imageMetas)
  if (size <= maxSize) return imageMetas

  // imageMetasから古い順に削除（オブジェクトのキー順）
  const imageKeys = Object.keys(imageMetas)
  if (imageKeys.length === 0) return imageMetas

  const trimmed = { ...imageMetas }
  for (const key of imageKeys) {
    delete trimmed[key]
    if (getImageMetasSize(trimmed) <= maxSize) {
      return trimmed
    }
  }

  return {}
}

// セッション配列から古いセッションの画像を削除
function trimOldestSessionImages(sessions: ChatSession[]): ChatSession[] {
  if (sessions.length === 0) return sessions

  const result = [...sessions]
  // 一番古いセッション（末尾）から画像を削除
  for (let i = result.length - 1; i >= 0; i--) {
    if (Object.keys(result[i].imageMetas).length > 0) {
      result[i] = { ...result[i], imageMetas: {} }
      return result
    }
  }

  // すべての画像が削除済みの場合、一番古いセッションを削除
  return result.slice(0, -1)
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
        // 保存失敗時：古いセッションから画像を削除してリトライ
        if (pendingSaveRef.current && pendingSaveRef.current.length > 0) {
          const trimmed = trimOldestSessionImages(pendingSaveRef.current)
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

      // 画像サイズを制限
      const trimmedImageMetas = trimSessionImages(
        imageMetas,
        MAX_IMAGE_SIZE_BYTES
      )

      const now = Date.now()
      let session: ChatSession

      if (currentSessionId) {
        // 既存セッション: タイトルは維持
        const existing = sessions.find(s => s.id === currentSessionId)
        session = {
          id: currentSessionId,
          title: existing?.title ?? DEFAULT_CHAT_TITLE,
          messages,
          imageMetas: trimmedImageMetas,
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
          messages,
          imageMetas: trimmedImageMetas,
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
