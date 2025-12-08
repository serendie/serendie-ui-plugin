import tokens from '@serendie/design-token'
import IssuesList from './IssuesList'
import { Result } from '../../models/Result'

const { sd } = tokens

type LintViewProps = {
  results: Result[]
}

export default function LintView({ results }: LintViewProps) {
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
