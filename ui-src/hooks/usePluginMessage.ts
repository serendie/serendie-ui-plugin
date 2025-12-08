import { useEffect } from 'react'
import { PluginMessage } from '../../shared-src/models/PluginMessage'

type MessageHandler = (message: PluginMessage) => void

export function usePluginMessage(handler: MessageHandler) {
  useEffect(() => {
    const onMessage = (
      event: MessageEvent<{ pluginMessage: PluginMessage }>
    ) => {
      const message = event.data.pluginMessage
      if (message) {
        handler(message)
      }
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [handler])
}

export function postPluginMessage(message: PluginMessage) {
  parent.postMessage({ pluginMessage: message }, '*')
}
