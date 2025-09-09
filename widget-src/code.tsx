import designToken from '@serendie/design-token'

import Button from './components/Button'
import Typography from './components/Typography'
import notify from './utils/notify'
import { runColorLinter } from './utils/colorLinter'

const { widget } = figma
const { AutoLayout } = widget
const libraryName = '🛠️ Serendie UI Kit'

async function handleClick() {
  const selections = figma.currentPage.selection.filter(
    node => node.type === 'FRAME'
  )
  if (selections.length == 0) {
    notify('フレームを選択してください')
    return
  }

  const selection = selections[0] as FrameNode
  let libraryCollections: LibraryVariableCollection[] = []
  try {
    libraryCollections =
      await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync()
  } catch (err) {
    notify('ライブラリのバリアブルコレクションを取得できませんでした')
    console.log('Failed to get library collections')
    return
  }

  const variables: {
    ref: { color: LibraryVariable[] }
    system: { color: LibraryVariable[] }
  } = { ref: { color: [] }, system: { color: [] } }
  const colorRefCollection = libraryCollections.find(
    ({ name, libraryName }) =>
      name === 'color-reference' && libraryName === libraryName
  )
  const colorSystemCollection = libraryCollections.find(
    ({ name, libraryName }) =>
      name === 'color-system' && libraryName === libraryName
  )
  if (!colorRefCollection || !colorSystemCollection) {
    notify(`次のライブラリを有効にしてください: ${libraryName}`)
    return
  }

  variables.ref.color =
    await figma.teamLibrary.getVariablesInLibraryCollectionAsync(
      colorRefCollection.key
    )
  variables.system.color =
    await figma.teamLibrary.getVariablesInLibraryCollectionAsync(
      colorSystemCollection.key
    )

  // Use rule-based validation (deterministic, no hallucination)
  const result = await runColorLinter(selection, false)
  
  // Display the lint results
  if (result) {
    if (result.isValid) {
      notify('✅ All color relationships are valid!')
    } else {
      notify(`⚠️ Found ${result.totalIssues} color issues. Check console for details.`)
      console.log('Lint Results:', result)
      
      // Log each issue for debugging
      result.issues.forEach((issue) => {
        console.log(`[${issue.severity}] ${issue.nodeName}: ${issue.message}`)
        console.log(`  Suggestion: ${issue.suggestion}`)
      })
    }
  }
}

function Widget() {
  const system = designToken.sd.system
  const reference = designToken.sd.reference

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
        <Button width='fill-parent' onClick={handleClick}>
          Run
        </Button>
      </AutoLayout>
    </AutoLayout>
  )
}

widget.register(Widget)
