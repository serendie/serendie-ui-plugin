import { useCallback } from 'react'
import {
  SelectionImage,
  SelectionInfo,
} from '../../shared-src/models/PluginMessage'

export type SelectionImagesResult = {
  images: string[]
  labels: string[]
}

export function useSelectionImages() {
  const getSelectionImages = useCallback(
    (selections: SelectionInfo[]): Promise<SelectionImagesResult> => {
      return new Promise(resolve => {
        if (selections.length === 0) {
          resolve({ images: [], labels: [] })
          return
        }

        const nodeIds = selections.map(s => s.id)
        const nameMap = new Map(selections.map(s => [s.id, s.name]))

        const handleMessage = (event: MessageEvent) => {
          const msg = event.data.pluginMessage
          if (msg?.type === 'selection-images') {
            window.removeEventListener('message', handleMessage)
            const validItems = (msg.images as SelectionImage[]).filter(
              (item): item is { nodeId: string; image: string } =>
                item.image !== null
            )
            resolve({
              images: validItems.map(item => item.image),
              labels: validItems.map(item => nameMap.get(item.nodeId) ?? ''),
            })
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
