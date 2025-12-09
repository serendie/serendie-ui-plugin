import { useState, useCallback, useEffect } from 'react'
import { usePluginMessage, postPluginMessage } from './usePluginMessage'
import {
  PluginMessage,
  SelectionInfo,
} from '../../shared-src/models/PluginMessage'

export function useSelection() {
  const [selections, setSelections] = useState<SelectionInfo[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleMessage = useCallback((message: PluginMessage) => {
    if (message.type === 'selection-changed') {
      setSelections(message.selections)
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
    selections,
    selectionIds: selections.map(s => s.id),
    hasSelection: selections.length > 0,
    error,
    clearError,
  }
}
