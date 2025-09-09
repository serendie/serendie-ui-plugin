import { LintResult, LintResultType } from '../schema/Lint'
import notify from './notify'
import generateObject from './generateObject'
import { validateWithRules } from './colorValidator'

type NodeColorInfo = {
  nodeId: string
  nodeName: string
  textColor: string | null
  backgroundColor: string | null
  isTextNode: boolean
}

function getVariableName(variable: Variable | null): string | null {
  if (!variable) return null
  return variable.name
}

async function getBackgroundColor(node: SceneNode): Promise<string | null> {
  if ('fills' in node && Array.isArray(node.fills) && node.fills.length > 0) {
    const fill = node.fills[0]
    if (fill.type === 'SOLID' && fill.visible !== false) {
      if ('boundVariables' in fill && fill.boundVariables?.color) {
        const variableId = fill.boundVariables.color.id
        const variable = await figma.variables.getVariableByIdAsync(variableId)
        return getVariableName(variable)
      }
    }
  }

  // If no background, check parent nodes
  if (
    node.parent &&
    node.parent.type !== 'PAGE' &&
    node.parent.type !== 'DOCUMENT'
  ) {
    return getBackgroundColor(node.parent as SceneNode)
  }

  return null
}

async function extractNodeColors(node: SceneNode): Promise<NodeColorInfo[]> {
  const results: NodeColorInfo[] = []

  if (node.type === 'TEXT') {
    const textNode = node as TextNode
    let textColor: string | null = null

    // Get text color
    if (
      'fills' in textNode &&
      Array.isArray(textNode.fills) &&
      textNode.fills.length > 0
    ) {
      const fill = textNode.fills[0]
      if (
        fill.type === 'SOLID' &&
        'boundVariables' in fill &&
        fill.boundVariables?.color
      ) {
        const variableId = fill.boundVariables.color.id
        const variable = await figma.variables.getVariableByIdAsync(variableId)
        textColor = getVariableName(variable)
      }
    }

    // Get background color from parent
    const backgroundColor = await getBackgroundColor(node.parent as SceneNode)

    results.push({
      nodeId: node.id,
      nodeName: node.name,
      textColor,
      backgroundColor,
      isTextNode: true,
    })
  }

  // Recursively process children
  if ('children' in node) {
    for (const child of node.children) {
      const childResults = await extractNodeColors(child)
      results.push(...childResults)
    }
  }

  return results
}

export async function runColorLinter(
  selection: FrameNode,
  useAI: boolean = false
): Promise<LintResultType> {
  const nodeColors = await extractNodeColors(selection)

  // Filter only text nodes with both text and background colors
  const textNodes = nodeColors.filter(
    node => node.isTextNode && node.textColor && node.backgroundColor
  )

  // Prepare data for analysis
  const colorPairs = textNodes.map(node => ({
    nodeId: node.nodeId,
    nodeName: node.nodeName,
    textColor: node.textColor!,
    backgroundColor: node.backgroundColor!,
  }))

  // Use rule-based validation by default (no hallucination risk)
  if (!useAI) {
    console.log('Using rule-based validation (deterministic)')
    const result = validateWithRules(colorPairs)
    console.log('Validation result:', result)
    return result
  }

  // AI-based validation (optional, with hallucination risk)
  console.log('Using AI-based validation (may hallucinate)')

  const prompt = `You are a design system color relationship validator for Serendie Design System.

Analyze the following text and background color pairs from a Figma design and validate if they follow the correct color relationship rules.

Color Relationship Rules:
- If background is "primary", text should be "onPrimary"
- If background is "primaryContainer", text should be "onPrimaryContainer"
- Same pattern applies for secondary, tertiary, surface, positive, negative, and notice variants
- The "on" prefix indicates a foreground color that should be used on the corresponding background
- The "Container" suffix indicates a larger surface area color variant

Color pairs to validate:
${JSON.stringify(colorPairs, null, 2)}

For each pair, determine if the relationship is correct. If not, provide the suggested correction.
Return a comprehensive lint result with all issues found.`

  const messages = [
    {
      role: 'system',
      content:
        'You are a Serendie Design System color validator. Analyze color relationships and provide detailed lint results.',
    },
    {
      role: 'user',
      content: prompt,
    },
  ]

  try {
    console.log('Sending color pairs for validation:', colorPairs)
    const result = await generateObject(LintResult, 'gpt-4o-mini', messages)

    if (!result) {
      console.error('No result from AI')
      return {
        isValid: false,
        totalIssues: 0,
        issues: [],
        summary: 'Failed to generate lint results',
      }
    }

    console.log('AI Lint result:', result)
    return result
  } catch (error) {
    console.error('Linting failed:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)

    // Check if it's an API key issue
    if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      notify('⚠️ OpenAI API Keyが無効です。設定を確認してください。')
      return {
        isValid: false,
        totalIssues: 0,
        issues: [],
        summary: 'OpenAI API Key is invalid',
      }
    }

    // Check if it's a network issue
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      notify('⚠️ ネットワークエラーが発生しました。接続を確認してください。')
      return {
        isValid: false,
        totalIssues: 0,
        issues: [],
        summary: 'Network error occurred',
      }
    }

    notify(`⚠️ AI Linter エラー: ${errorMessage}`)
    return {
      isValid: false,
      totalIssues: 0,
      issues: [],
      summary: `AI Linter failed: ${errorMessage}`,
    }
  }
}
