import tokens from '@serendie/design-token'

const { sd } = tokens

interface SuggestedQuestionsProps {
  questions: string[]
  onSelect: (question: string) => void
  isLoading?: boolean
}

export default function SuggestedQuestions({
  questions,
  onSelect,
  isLoading = false,
}: SuggestedQuestionsProps) {
  if (!isLoading && questions.length === 0) {
    return null
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: sd.system.dimension.spacing.twoExtraSmall,
      }}
    >
      {isLoading ? (
        <div
          style={{
            ...sd.system.typography.body.extraSmall_expanded,
            color: sd.system.color.component.onSurface,
            backgroundColor: sd.system.color.component.surface,
            border: `${sd.system.dimension.border.medium} solid ${sd.system.color.component.outline}`,
            borderRadius: sd.system.dimension.radius.extraLarge,
            padding: `${sd.system.dimension.spacing.extraSmall} ${sd.system.dimension.spacing.small}`,
          }}
        >
          ...
        </div>
      ) : (
        questions.map((question, index) => (
          <button
            key={index}
            onClick={() => onSelect(question)}
            style={{
              ...sd.system.typography.body.extraSmall_expanded,
              color: sd.system.color.component.onSurface,
              backgroundColor: sd.system.color.component.surface,
              border: `${sd.system.dimension.border.medium} solid ${sd.system.color.component.outline}`,
              borderRadius: sd.system.dimension.radius.extraLarge,
              padding: `${sd.system.dimension.spacing.extraSmall} ${sd.system.dimension.spacing.small}`,
              maxWidth: '240px',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor =
                sd.system.color.impression.secondaryContainer
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor =
                sd.system.color.component.surface
            }}
          >
            {question}
          </button>
        ))
      )}
    </div>
  )
}
