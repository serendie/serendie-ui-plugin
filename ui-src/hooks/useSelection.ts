import { useState, useCallback, useEffect } from 'react'
import { usePluginMessage, postPluginMessage } from './usePluginMessage'
import { PluginMessage } from '../../shared-src/models/PluginMessage'

export function useSelection() {
  const [selectionIds, setSelectionIds] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleMessage = useCallback((message: PluginMessage) => {
    if (message.type === 'selection-changed') {
      setSelectionIds(message.selectionIds)
    }
    if (message.type === 'error') {
      setError(message.message)
    }
  }, [])

  usePluginMessage(handleMessage)

  useEffect(() => {
    postPluginMessage({ type: 'request-selection' })
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return {
    selectionIds,
    hasSelection: selectionIds.length > 0,
    error,
    clearError,
  }
}
