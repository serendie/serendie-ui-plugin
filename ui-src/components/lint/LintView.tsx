import { useState, useCallback } from 'react'
import tokens from '@serendie/design-token'
import IssuesList from './IssuesList'
import { Result } from '../../models/Result'
import {
  usePluginMessage,
  postPluginMessage,
} from '../../hooks/usePluginMessage'
import { PluginMessage } from '../../../shared-src/models/PluginMessage'

const { sd } = tokens

export default function LintView() {
  const [results, setResults] = useState<Result[]>([])
  const [_isLoading, setIsLoading] = useState(false)

  const handleMessage = useCallback((message: PluginMessage) => {
    if (message.type === 'lint-result') {
      setIsLoading(false)
      setResults(message.results)
    }
  }, [])

  usePluginMessage(handleMessage)

  const _handleRunLinter = useCallback(() => {
    setIsLoading(true)
    postPluginMessage({ type: 'run-linter' })
  }, [])
  return (
    <div
      style={{
        height: '100%',
        overflow: 'auto',
        padding: sd.system.dimension.spacing.extraLarge,
        paddingBottom: sd.system.dimension.spacing.threeExtraLarge,
        backgroundColor: sd.system.color.impression.tertiaryContainer,
      }}
    >
      {results.length > 0 && (
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
  )
}
