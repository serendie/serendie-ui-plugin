import { useState, useCallback } from 'react'
import { Button } from '@serendie/ui'
import tokens from '@serendie/design-token'
import IssuesList from './IssuesList'
import { Result } from '../../models/Result'
import {
  usePluginMessage,
  postPluginMessage,
} from '../../hooks/usePluginMessage'
import { PluginMessage } from '../../../shared-src/models/PluginMessage'

const { sd } = tokens

type LintPhase = 'selecting' | 'results'

export default function LintView() {
  const [phase, setPhase] = useState<LintPhase>('selecting')
  const [results, setResults] = useState<Result[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleMessage = useCallback((message: PluginMessage) => {
    if (message.type === 'lint-result') {
      setIsLoading(false)
      setResults(message.results)
      setPhase('results')
    }
  }, [])

  usePluginMessage(handleMessage)

  const handleRunLinter = useCallback(() => {
    setIsLoading(true)
    postPluginMessage({ type: 'run-linter' })
  }, [])

  const handleReselect = useCallback(() => {
    setPhase('selecting')
    setResults([])
  }, [])

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: sd.system.color.impression.tertiaryContainer,
      }}
    >
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: sd.system.dimension.spacing.extraLarge,
          paddingBottom: sd.system.dimension.spacing.threeExtraLarge,
        }}
      >
        {phase === 'results' && results.length > 0 && (
          <div>
            {results.map((result, i) => (
              <div
                key={result.id}
                style={{
                  marginBottom:
                    i == results.length - 1
                      ? 0
                      : sd.system.dimension.spacing.twoExtraLarge,
                }}
              >
                <IssuesList
                  issues={result.issues}
                  totalNodes={result.totalNodes}
                  targetName={result.name}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          padding: sd.system.dimension.spacing.large,
          display: 'flex',
          gap: sd.system.dimension.spacing.small,
        }}
      >
        {phase === 'selecting' ? (
          <Button
            onClick={handleRunLinter}
            disabled={isLoading}
            style={{ flex: 1 }}
          >
            {isLoading ? '検証中...' : '検証する'}
          </Button>
        ) : (
          <>
            <Button
              onClick={handleRunLinter}
              disabled={isLoading}
              style={{ flex: 1 }}
            >
              {isLoading ? '検証中...' : '再検証'}
            </Button>
            <Button
              onClick={handleReselect}
              styleType="outlined"
              style={{ flex: 1 }}
            >
              要素を選び直す
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
