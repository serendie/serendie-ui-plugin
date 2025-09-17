import tokens from '@serendie/design-token'

const { sd } = tokens

export default function serializeBoxShadow({
  offsetX,
  offsetY,
  blur,
  spread,
  color,
}: typeof sd.system.elevation.shadow.level1): string {
  return `${offsetX} ${offsetY} ${blur} ${spread} ${color}`
}
