import tokens from '@serendie/design-token'

import StatLabel from './StatLabel'

const { sd } = tokens

export default function ComponentIssueHeader({
  count,
  resolvedCount = 0,
}: {
  count: number
  resolvedCount?: number
}) {
  const unresolvedCount = count - resolvedCount
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: sd.system.dimension.spacing.medium,
        marginBottom: sd.system.dimension.spacing.extraSmall,
        padding: sd.system.dimension.spacing.small,
        backgroundColor: sd.system.color.component.surface,
        borderRadius: sd.system.dimension.radius.medium,
        border: `1px solid ${sd.system.color.component.outline}`,
      }}
    >
      {count > 0 ? (
        <>
          {resolvedCount > 0 && (
            <StatLabel
              symbolName='check-circle'
              targetNodes={resolvedCount}
              label='個適用済み'
            />
          )}
          {unresolvedCount > 0 && (
            <StatLabel
              symbolName='alert-triangle'
              targetNodes={unresolvedCount}
              label='個のコンポーネントで利用可能'
            />
          )}
        </>
      ) : (
        <span
          style={{
            ...sd.system.typography.body.small_expanded,
            color: sd.system.color.component.onSurfaceVariant,
          }}
        >
          利用可能なコンポーネントは見つかりませんでした
        </span>
      )}
    </div>
  )
}
