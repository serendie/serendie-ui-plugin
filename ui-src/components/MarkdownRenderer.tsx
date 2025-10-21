import tokens from '@serendie/design-token'
import ReactMarkdown from 'react-markdown'

const { sd } = tokens

export default function MarkdownRenderer({
  children: content,
}: {
  children: string
}) {
  return (
    <div
      style={{
        maxWidth: '100%',
        overflowWrap: 'break-word',
        wordBreak: 'break-word',
      }}
    >
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1
              style={{
                ...sd.system.typography.headline.small_expanded,
                marginTop: sd.system.dimension.spacing.medium,
                marginBottom: sd.system.dimension.spacing.extraSmall,
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
              }}
            >
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2
              style={{
                ...sd.system.typography.headline.small_expanded,
                marginTop: sd.system.dimension.spacing.medium,
                marginBottom: sd.system.dimension.spacing.extraSmall,
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
              }}
            >
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3
              style={{
                ...sd.system.typography.headline.small_expanded,
                marginTop: sd.system.dimension.spacing.medium,
                marginBottom: sd.system.dimension.spacing.extraSmall,
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
              }}
            >
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p
              style={{
                ...sd.system.typography.body.medium_expanded,
                lineHeight: sd.reference.typography.lineHeight.tight,
                marginBottom: sd.system.dimension.spacing.small,
              }}
            >
              {children}
            </p>
          ),
          code: ({ children }) => (
            <code
              style={{
                ...sd.system.typography.body.small_expanded,
                display: 'inline-block',
                color: sd.system.color.impression.onSecondaryContainer,
                backgroundColor: sd.system.color.impression.secondaryContainer,
                borderRadius: sd.system.dimension.radius.small,
                padding: `${sd.system.dimension.spacing.twoExtraSmall} ${sd.system.dimension.spacing.extraSmall}`,
                maxWidth: '100%',
                overflowWrap: 'break-word',
                wordBreak: 'break-all',
                whiteSpace: 'pre-wrap',
              }}
            >
              {children}
            </code>
          ),
          ul: ({ children }) => (
            <ul
              style={{
                paddingLeft: sd.system.dimension.spacing.large,
                marginBottom: sd.system.dimension.spacing.small,
                listStyleType: 'disc',
              }}
            >
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol
              style={{
                paddingLeft: sd.system.dimension.spacing.large,
                marginBottom: sd.system.dimension.spacing.small,
                listStyleType: 'decimal',
              }}
            >
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li
              style={{
                marginBottom: sd.system.dimension.spacing.extraSmall,
              }}
            >
              {children}
            </li>
          ),
          hr: () => (
            <hr
              style={{
                border: 'none',
                borderTop: `1px solid ${sd.system.color.component.outline}`,
                margin: `${sd.system.dimension.spacing.twoExtraLarge} 0`,
              }}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
