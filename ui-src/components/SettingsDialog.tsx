import React, { useState, useEffect } from 'react'
import tokens from '@serendie/design-token'
import { Button, TextField } from '@serendie/ui'

import { useApiKey } from '../hooks/useApiKey'

const { sd } = tokens

interface SettingsDialogProps {
  open: boolean
  onClose: () => void
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ open, onClose }) => {
  const { apiKey: initialApiKey, saveApiKey } = useApiKey()
  const [apiKey, setApiKey] = useState('')

  useEffect(() => {
    if (open) {
      setApiKey(initialApiKey)
    }
  }, [open, initialApiKey])

  const handleSave = async () => {
    saveApiKey(apiKey)
    onClose()
  }

  if (!open) return null

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: sd.system.elevation.zIndex.modal,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: sd.system.dimension.spacing.large,
        }}
        onClick={onClose}
      >
        <div
          style={{
            width: '100%',
            backgroundColor: sd.system.color.component.surface,
            borderRadius: sd.system.dimension.radius.large,
            padding: sd.system.dimension.spacing.large,
            boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.2)',
          }}
          onClick={e => e.stopPropagation()}
        >
          <h2
            style={{
              fontSize: sd.reference.typography.scale.expanded.large,
              fontWeight: sd.reference.typography.fontWeight.bold,
              marginBottom: sd.system.dimension.spacing.medium,
              color: sd.system.color.component.onSurface,
            }}
          >
            設定
          </h2>
          <div style={{ marginBottom: sd.system.dimension.spacing.large }}>
            <TextField
              value={apiKey}
              label='OpenAI API Key'
              description='デバイス内に安全に保存されます'
              onChange={e => setApiKey(e.target.value)}
              type='password'
              placeholder='sk-...'
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: sd.system.dimension.spacing.extraSmall,
            }}
          >
            <Button styleType='ghost' onClick={onClose}>
              キャンセル
            </Button>
            <Button
              styleType='filled'
              onClick={handleSave}
              disabled={apiKey === initialApiKey}
            >
              保存
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

export default SettingsDialog
