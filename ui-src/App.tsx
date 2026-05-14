import { useState } from 'react'
import {
  IconButton,
  ProgressIndicatorIndeterminate,
  TabItem,
  Tabs,
} from '@serendie/ui'
import tokens from '@serendie/design-token'
import { SerendieSymbol } from '@serendie/symbols'

import LintView from './components/lint/LintView'
import ChatView from './components/chat/ChatView'
import SettingsDialog from './components/SettingsDialog'

const { sd } = tokens

export default function App() {
  const [currentView, setCurrentView] = useState<'chat' | 'lint'>('chat')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [isChatStreaming, setIsChatStreaming] = useState(false)
  const [isLintAnalyzing, setIsLintAnalyzing] = useState(false)

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
          margin: `0 -${sd.system.dimension.spacing.twoExtraSmall}`,
          width: `calc(100% + ${sd.system.dimension.spacing.twoExtraSmall} * 2)`,
          height: 1,
          overflow: 'hidden',
        }}
      >
        {(isChatStreaming || isLintAnalyzing) && (
          <ProgressIndicatorIndeterminate size='small' type='linear' />
        )}
      </div>
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
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: currentView === 'chat' ? 'flex' : 'none',
          flexDirection: 'column',
        }}
      >
        <ChatView
          isActive={currentView === 'chat'}
          onStreamingChange={setIsChatStreaming}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      </div>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: currentView === 'lint' ? 'flex' : 'none',
          flexDirection: 'column',
        }}
      >
        <LintView
          isActive={currentView === 'lint'}
          onAnalyzingChange={setIsLintAnalyzing}
        />
      </div>
      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  )
}
