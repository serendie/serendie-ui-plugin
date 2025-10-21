import { useEffect, useState } from 'react'
import { Result } from '../models/Result'

export function useSelectionImage(result: Result | null) {
  const [image, setImage] = useState<string | null>(null)

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const msg = event.data.pluginMessage
      if (msg?.type === 'selection-image') {
        setImage(msg.image)
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  useEffect(() => {
    setImage(null)
    if (result?.id) {
      parent.postMessage(
        { pluginMessage: { type: 'get-selection-image', nodeId: result.id } },
        '*'
      )
    }
  }, [result])

  return image
}
