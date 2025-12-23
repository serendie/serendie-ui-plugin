import { useEffect, useState, useCallback } from 'react'
import tokens from '@serendie/design-token'
import { ProgressIndicator } from '@serendie/ui'
import {
  SelectionInfo,
  PluginMessage,
} from '../../../shared-src/models/PluginMessage'
import {
  usePluginMessage,
  postPluginMessage,
} from '../../hooks/usePluginMessage'

const { sd } = tokens

interface SelectionCardProps {
  selection: SelectionInfo
  onLoadComplete?: (nodeId: string) => void
}

export default function SelectionCard({
  selection,
  onLoadComplete,
}: SelectionCardProps) {
  const [image, setImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const handleMessage = useCallback(
    (message: PluginMessage) => {
      if (message.type === 'selection-images') {
        const found = message.images.find(img => img.nodeId === selection.id)
        if (found) {
          setImage(found.image)
          setIsLoading(false)
          onLoadComplete?.(selection.id)
        }
      }
    },
    [selection.id, onLoadComplete]
  )
  usePluginMessage(handleMessage)

  useEffect(() => {
    setImage(null)
    setIsLoading(true)
    postPluginMessage({ type: 'get-selection-images', nodeIds: [selection.id] })
  }, [selection.id])

  const height = '10rem'

  return (
    <div>
      <p
        style={{
          ...sd.system.typography.label.medium_expanded,
          fontWeight: 'bold',
          color: sd.system.color.component.onSurface,
          marginLeft: sd.system.dimension.spacing.extraSmall,
          marginBottom: sd.system.dimension.spacing.small,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {selection.name}
      </p>
      <div
        style={{
          backgroundColor: sd.system.color.component.surface,
          borderRadius: sd.system.dimension.radius.medium,
          padding: sd.system.dimension.spacing.medium,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isLoading ? (
          <div
            style={{
              height,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ProgressIndicator size='medium' />
          </div>
        ) : image ? (
          <img
            src={image}
            alt={selection.name}
            style={{
              maxWidth: '100%',
              height,
              objectFit: 'contain',
            }}
          />
        ) : (
          <p
            style={{
              ...sd.system.typography.body.small_expanded,
              color: sd.system.color.component.onSurfaceVariant,
              height,
              // center the text vertically
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            プレビューを取得できません
          </p>
        )}
      </div>
    </div>
  )
}
