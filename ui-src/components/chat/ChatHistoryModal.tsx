import { useState, useMemo } from 'react'
import tokens from '@serendie/design-token'
import { Search } from '@serendie/ui'
import { createListCollection } from '@ark-ui/react'
import { ChatSession } from '../../models/ChatSession'

const { sd } = tokens

function SessionItem({
  session,
  onSelect,
}: {
  session: ChatSession
  onSelect: () => void
}) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: sd.system.dimension.spacing.small,
        padding: sd.system.dimension.spacing.extraSmall,
        border: 'none',
        borderRadius: sd.system.dimension.radius.small,
        background: isHovered
          ? sd.system.color.interaction.hovered
          : 'transparent',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <span
        style={{
          ...sd.system.typography.body.extraSmall_expanded,
          color: sd.system.color.component.onSurface,
          flex: 1,
        }}
      >
        {session.title}
      </span>
      <span
        style={{
          ...sd.system.typography.label.small_compact,
          color: sd.system.color.component.onSurfaceVariant,
          whiteSpace: 'nowrap',
        }}
      >
        {formatRelativeTime(session.updatedAt)}
      </span>
    </button>
  )
}

interface ChatHistoryModalProps {
  open: boolean
  onClose: () => void
  sessions: ChatSession[]
  onSelectSession: (sessionId: string) => void
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  const weeks = Math.floor(diff / 604800000)
  const months = Math.floor(diff / 2592000000)
  const years = Math.floor(diff / 31536000000)

  if (minutes < 1) return 'たった今'
  if (minutes < 60) return `${minutes}分前`
  if (hours < 24) return `${hours}時間前`
  if (days === 1) return '昨日'
  if (days < 7) return `${days}日前`
  if (weeks < 4) return `${weeks}週間前`
  if (months < 12) return `${months}ヶ月前`
  return `${years}年前`
}

export default function ChatHistoryModal({
  open,
  onClose,
  sessions,
  onSelectSession,
}: ChatHistoryModalProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const collection = useMemo(
    () => createListCollection({ items: sessions.map(s => s.title) }),
    [sessions]
  )

  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions
    const query = searchQuery.toLowerCase()
    return sessions.filter(session =>
      session.title.toLowerCase().includes(query)
    )
  }, [sessions, searchQuery])

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: sd.system.elevation.zIndex.modal,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: sd.system.dimension.spacing.large,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxHeight: '80vh',
          backgroundColor: sd.system.color.component.surface,
          borderRadius: sd.system.dimension.radius.large,
          padding: sd.system.dimension.spacing.large,
          boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ marginBottom: sd.system.dimension.spacing.medium }}>
          <Search
            collection={collection}
            size='small'
            placeholder='検索'
            inputValue={searchQuery}
            onInputValueChange={details => setSearchQuery(details.inputValue)}
          />
        </div>
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            minHeight: 0,
            maxHeight: 336,
            padding: sd.system.dimension.spacing.extraSmall,
            borderStyle: 'solid',
            borderWidth: sd.system.dimension.border.medium,
            borderColor: sd.system.color.component.outline,
            borderRadius: sd.system.dimension.radius.medium,
          }}
        >
          {filteredSessions.length === 0 ? (
            <p
              style={{
                ...sd.system.typography.body.extraSmall_expanded,
                color: sd.system.color.component.onSurfaceVariant,
                textAlign: 'center',
                padding: sd.system.dimension.spacing.large,
              }}
            >
              {searchQuery ? '該当する履歴がありません' : '履歴がありません'}
            </p>
          ) : (
            filteredSessions.map(session => (
              <SessionItem
                key={session.id}
                session={session}
                onSelect={() => {
                  onSelectSession(session.id)
                  onClose()
                }}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
