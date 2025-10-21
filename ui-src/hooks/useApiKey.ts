import { useCallback, useEffect, useState } from 'react'
import ClientStorage from '../../shared-src/models/ClientStorage'

export function useApiKey() {
  const [apiKey, setApiKey] = useState('')

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { type, value, key } = event.data.pluginMessage || {}
      if (type === 'storage-value') {
        setApiKey(value || '')
      }
      if (type === 'storage-saved' && key === ClientStorage.OPENAI_API_KEY) {
        parent.postMessage(
          {
            pluginMessage: {
              type: 'get-storage',
              key: ClientStorage.OPENAI_API_KEY,
            },
          },
          '*'
        )
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

  const saveApiKey = useCallback((value: string) => {
    parent.postMessage(
      {
        pluginMessage: {
          type: 'set-storage',
          key: ClientStorage.OPENAI_API_KEY,
          value,
        },
      },
      '*'
    )
  }, [])

  return { apiKey, saveApiKey }
}
