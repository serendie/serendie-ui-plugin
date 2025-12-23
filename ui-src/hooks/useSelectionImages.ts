import { useCallback } from 'react'
import {
  SelectionImage,
  SelectionInfo,
} from '../../shared-src/models/PluginMessage'

export type SelectionImageItem = {
  image: string
  label: string
  nodeId: string
}

export function useSelectionImages() {
  const getSelectionImages = useCallback(
    (selections: SelectionInfo[]): Promise<SelectionImageItem[]> => {
      return new Promise(resolve => {
        if (selections.length === 0) {
          resolve([])
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
            resolve(
              validItems.map(item => ({
                image: item.image,
                label: nameMap.get(item.nodeId) ?? '',
                nodeId: item.nodeId,
              }))
            )
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
