import tokens from '@serendie/design-token'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const { sd } = tokens

export const FIGMA_NODE_SCHEME = 'figma://node/'

function MarkdownLink({
  href,
  children,
}: {
  href?: string
  children: React.ReactNode
}) {
  const [isHovered, setIsHovered] = useState(false)
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!href) return

    if (href.startsWith(FIGMA_NODE_SCHEME)) {
      const nodeId = href.replace(FIGMA_NODE_SCHEME, '')
      console.log('Figma link clicked:', { href, nodeId })
      parent.postMessage(
        {
          pluginMessage: {
            type: 'select-node',
            nodeId,
          },
        },
        '*'
      )
    } else {
      window.open(href, '_blank')
    }
  }

  const primaryColor = sd.system.color.impression.primary
  const hoveredColor = `color-mix(in srgb, ${sd.system.color.impression.primary} 80%, black)`

  return (
    <a
      href={href}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        color: isHovered ? hoveredColor : primaryColor,
        textDecoration: 'underline',
        cursor: 'pointer',
        transition: 'color 0.2s',
      }}
    >
      {children}
    </a>
  )
}

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
        remarkPlugins={[remarkGfm]}
        urlTransform={url => {
          if (url.startsWith(FIGMA_NODE_SCHEME)) {
            return url
          }
          return url
        }}
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
          a: ({ href, children }) => (
            <MarkdownLink href={href}>{children}</MarkdownLink>
          ),
          table: ({ children }) => (
            <div
              style={{
                overflowX: 'auto',
                marginBottom: sd.system.dimension.spacing.small,
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  ...sd.system.typography.body.small_expanded,
                }}
              >
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead
              style={{
                backgroundColor: sd.system.color.impression.secondaryContainer,
              }}
            >
              {children}
            </thead>
          ),
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => (
            <tr
              style={{
                borderBottom: `${sd.system.dimension.border.medium} solid ${sd.system.color.component.outline}`,
              }}
            >
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th
              style={{
                padding: sd.system.dimension.spacing.extraSmall,
                textAlign: 'left',
                fontWeight: sd.reference.typography.fontWeight.bold,
                color: sd.system.color.impression.onSecondaryContainer,
                whiteSpace: 'nowrap',
              }}
            >
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td
              style={{
                padding: sd.system.dimension.spacing.extraSmall,
                color: sd.system.color.component.onSurface,
              }}
            >
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
