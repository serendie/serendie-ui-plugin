import { useState } from 'react'
import { IconButton, TabItem, Tabs } from '@serendie/ui'
import tokens from '@serendie/design-token'
import { SerendieSymbol } from '@serendie/symbols'

import LintView from './components/lint/LintView'
import ChatView from './components/chat/ChatView'
import SettingsDialog from './components/SettingsDialog'

const { sd } = tokens

export default function App() {
  const [currentView, setCurrentView] = useState<'chat' | 'lint'>('chat')
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: sd.reference.typography.fontFamily.primary,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingRight: sd.system.dimension.spacing.small,
        }}
      >
        <Tabs
          defaultValue='chat'
          style={{ width: '15rem' }}
          onValueChange={details =>
            setCurrentView(details.value as 'chat' | 'lint')
          }
        >
          <TabItem title='相談する' value='chat' />
          <TabItem title='検証する' value='lint' />
        </Tabs>
        <IconButton
          icon={<SerendieSymbol name='gear' />}
          onClick={() => setSettingsOpen(true)}
          shape='rectangle'
          styleType='ghost'
          size='small'
        />
      </div>
      <div style={{ flex: 1, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            transform: `translateX(${currentView === 'lint' ? '-100%' : '0'})`,
            transition: 'transform 0.3s ease-in-out',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <ChatView />
        </div>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            transform: `translateX(${currentView === 'lint' ? '0' : '100%'})`,
            transition: 'transform 0.3s ease-in-out',
          }}
        >
          <LintView />
        </div>
      </div>
      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  )
}
