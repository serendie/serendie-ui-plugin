import { useCallback } from 'react'
import { SelectionImage } from '../../shared-src/models/PluginMessage'

export function useSelectionImages() {
  const getSelectionImages = useCallback(
    (nodeIds: string[]): Promise<string[]> => {
      return new Promise(resolve => {
        if (nodeIds.length === 0) {
          resolve([])
          return
        }

        const handleMessage = (event: MessageEvent) => {
          const msg = event.data.pluginMessage
          if (msg?.type === 'selection-images') {
            window.removeEventListener('message', handleMessage)
            const images = (msg.images as SelectionImage[])
              .filter(
                (item): item is { nodeId: string; image: string } =>
                  item.image !== null
              )
              .map(item => item.image)
            resolve(images)
          }
        }
        window.addEventListener('message', handleMessage)

        parent.postMessage(
          { pluginMessage: { type: 'get-selection-images', nodeIds } },
          '*'
        )
      })
    },
    []
  )

  return { getSelectionImages }
}
