import { fontFamily } from '../styles'

const { widget } = figma
const { Text } = widget

type TextStyle = {
  fontSize: string
  fontWeight: number
  fontFamily: string
  lineHeight: number
}

export default function Typography({
  children,
  textStyle,
  fill,
}: {
  children: string
  textStyle: TextStyle
  fill: string
}) {
  return (
    <Text
      fontFamily={fontFamily}
      fontSize={parseInt(textStyle.fontSize)}
      fontWeight={textStyle.fontWeight as WidgetJSX.FontWeight}
      fill={fill}
    >
      {children}
    </Text>
  )
}
