import designToken from '@serendie/design-token'

import { Button } from './components/Button'

const { widget } = figma
const { AutoLayout } = widget

type SceneNodeStructure = {
  id: string
  name: string
  type: SceneNode['type']
  visible: boolean
  children: SceneNodeStructure[]
}

function getStructure(node: SceneNode, depth = 0): SceneNodeStructure {
  return {
    id: node.id,
    name: node.name,
    type: node.type,
    visible: node.visible,
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
  const handleGetSelection = async () => {
    const selections = figma.currentPage.selection.filter(
      node => node.type === 'FRAME'
    )

    if (selections.length > 0) {
      const frame = selections[0] as FrameNode

      console.log('Frame name:', frame.name)
      console.log('Frame size:', frame.width, 'x', frame.height)
      console.log('Children count:', frame.children.length)
      console.log('Fill:', frame.fills)

      const imageData = await frame.exportAsync({
        format: 'PNG',
        constraint: { type: 'SCALE', value: 2 },
      })
      const base64 = figma.base64Encode(imageData)
      const dataUrl = `data:image/png;base64,${base64}`
      console.log('Data URL created:', dataUrl)

      const structure = getStructure(frame)
      console.log('Frame structure:', JSON.stringify(structure, null, 2))
    }
  }

  return (
    <AutoLayout
      fill={system.color.component.surface}
      padding={parseInt(system.dimension.spacing.extraLarge)}
      cornerRadius={parseInt(system.dimension.radius.extraLarge)}
      verticalAlignItems='center'
      horizontalAlignItems='center'
    >
      <Button onClick={handleGetSelection}>Get Selected Frame</Button>
    </AutoLayout>
  )
}

widget.register(Widget)
