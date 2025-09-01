import designTokens from '@serendie/design-token'
import { fontFamily } from '../styles'

const { widget } = figma
const { AutoLayout, Text } = widget

export function Button({
  children,
  onClick,
}: {
  children: string
  onClick: () => void
}) {
  const impression = designTokens.sd.system.color.impression
  const label = designTokens.sd.system.typography.label.large_expanded
  const spacing = designTokens.sd.system.dimension.spacing
  const radius = designTokens.sd.system.dimension.radius
  const scale = designTokens.sd.reference.dimension.scale

  return (
    <AutoLayout
      onClick={onClick}
      fill={impression.primaryContainer}
      padding={{
        top: parseInt(spacing.twoExtraSmall),
        right: parseInt(spacing.small),
        bottom: parseInt(spacing.twoExtraSmall),
        left: parseInt(spacing.small),
      }}
      cornerRadius={parseInt(radius.full)}
      height={parseInt(scale[10])}
      horizontalAlignItems='center'
      verticalAlignItems='center'
    >
      <Text
        fill={impression.onPrimary}
        fontFamily={fontFamily}
        fontSize={parseInt(label.fontSize)}
        fontWeight={label.fontWeight as WidgetJSX.FontWeight}
      >
        {children}
      </Text>
    </AutoLayout>
  )
}
