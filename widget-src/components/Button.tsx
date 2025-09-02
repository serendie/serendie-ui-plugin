import designTokens from '@serendie/design-token'
import { fontFamily } from '../styles'

const { widget } = figma
const { AutoLayout, Text } = widget

export default function Button({
  children,
  onClick,
  width = 'hug-contents',
}: {
  children: string
  onClick: () => void
  width?: WidgetJSX.AutolayoutSize
}) {
  const system = designTokens.sd.system
  const reference = designTokens.sd.reference

  return (
    <AutoLayout
      width={width}
      onClick={onClick}
      fill={system.color.impression.primaryContainer}
      padding={{
        top: parseInt(system.dimension.spacing.small),
        right: parseInt(system.dimension.spacing.extraLarge),
        bottom: parseInt(system.dimension.spacing.small),
        left: parseInt(system.dimension.spacing.extraLarge),
      }}
      cornerRadius={parseInt(system.dimension.radius.full)}
      height={parseInt(reference.dimension.scale[13])}
      horizontalAlignItems='center'
      verticalAlignItems='center'
    >
      <Text
        fill={system.color.impression.onPrimary}
        fontFamily={fontFamily}
        fontSize={parseInt(system.typography.label.large_compact.fontSize)}
        fontWeight={
          system.typography.label.large_compact
            .fontWeight as WidgetJSX.FontWeight
        }
      >
        {children}
      </Text>
    </AutoLayout>
  )
}
