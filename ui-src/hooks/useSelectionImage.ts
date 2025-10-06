import { useEffect, useState } from 'react'
import { Result } from '../App'

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
    // ChatView表示時に画像を自動取得
    parent.postMessage({ pluginMessage: { type: 'get-selection-image' } }, '*')
  }, [result])

  return image
}
