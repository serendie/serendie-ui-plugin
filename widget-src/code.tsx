import designToken from '@serendie/design-token'

import Button from './components/Button'
import Typography from './components/Typography'

const { widget } = figma
const { AutoLayout } = widget

type SceneNodeStructure = {
  id: string
  name: string
  type: SceneNode['type']
  visible: boolean
  fills?: readonly Paint[] | typeof figma.mixed
  children: SceneNodeStructure[]
}

function getStructure(node: SceneNode, depth = 0): SceneNodeStructure {
  return {
    id: node.id,
    name: node.name,
    type: node.type,
    visible: node.visible,
    fills: 'fills' in node ? node.fills : undefined,
    children:
      'children' in node
        ? node.children
            .map(child => getStructure(child, depth + 1))
            .filter(child => child.visible)
        : [],
  }
}

function Widget() {
  const system = designToken.sd.system
  const reference = designToken.sd.reference
  const handleGetSelection = async () => {
    const selections = figma.currentPage.selection.filter(
      node => node.type === 'FRAME'
    )

    if (selections.length > 0) {
      const frame = selections[0] as FrameNode
      const imageData = await frame.exportAsync({
        format: 'PNG',
        constraint: { type: 'SCALE', value: 2 },
      })
      const base64 = figma.base64Encode(imageData)
      const dataUrl = `data:image/png;base64,${base64}`
      const structure = getStructure(frame)
      console.log('Data URL created:', dataUrl)
      console.log('Frame structure:', JSON.stringify(structure, null, 2))
    }
  }

  return (
    <AutoLayout
      width={parseInt(reference.dimension.breakpoint.small)}
      fill={system.color.component.surface}
      cornerRadius={parseInt(system.dimension.radius.extraLarge)}
      direction='vertical'
      verticalAlignItems='center'
      horizontalAlignItems='start'
      effect={{
        type: 'drop-shadow',
        color: system.elevation.shadow.level5.color,
        offset: { x: 0, y: 2 },
        blur: parseInt(system.elevation.shadow.level5.blur),
        blendMode: 'pass-through',
        spread: parseInt(system.elevation.shadow.level5.spread),
        visible: true,
        showShadowBehindNode: true,
      }}
    >
      <AutoLayout
        width='fill-parent'
        direction='vertical'
        spacing={parseInt(system.dimension.spacing.extraSmall)}
        padding={parseInt(system.dimension.spacing.fourExtraLarge)}
        fill={system.color.impression.tertiaryContainer}
      >
        <Typography
          textStyle={system.typography.body.small_compact}
          fill={system.color.component.onSurfaceVariant}
        >
          Serendie Design System
        </Typography>
        <Typography
          textStyle={system.typography.headline.medium_compact}
          fill={system.color.impression.onTertiaryContainer}
        >
          AI Linter
        </Typography>
      </AutoLayout>
      <AutoLayout
        width='fill-parent'
        direction='vertical'
        spacing={parseInt(system.dimension.spacing.extraSmall)}
        padding={parseInt(system.dimension.spacing.fourExtraLarge)}
      >
        <Button width='fill-parent' onClick={handleGetSelection}>
          Run
        </Button>
      </AutoLayout>
    </AutoLayout>
  )
}

widget.register(Widget)
