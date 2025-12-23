import { tool, Tool } from 'ai'
import { useMemo } from 'react'
import { z } from 'zod'
import {
  LintResult,
  NodeAnalysis,
  PluginMessage,
} from '../../shared-src/models/PluginMessage'
import { serializeIssues } from '../../shared-src/models/Rules'
import { postPluginMessage } from './usePluginMessage'

const runLinterParams = z.object({
  nodeIds: z
    .array(z.string())
    .describe(
      '検証対象のノードID配列。ユーザーが選択中のノードIDを指定してください。'
    ),
})

function serializeNodeAnalysis(node: NodeAnalysis, indent = 0): string {
  const indentStr = '  '.repeat(indent)

  const details: string[] = []

  if (node.fills.length > 0) {
    details.push(`fills: [${node.fills.join(', ')}]`)
  }

  if (node.strokes.length > 0) {
    details.push(`strokes: [${node.strokes.join(', ')}]`)
  }

  details.push(`size: ${node.width}x${node.height}`)

  const detailsStr = details.length > 0 ? ` ${details.join(', ')}` : ''

  let result = `${indentStr}- ${node.nodeName} (${node.nodeType})${detailsStr}\n`

  if (node.children.length > 0) {
    for (const child of node.children) {
      result += serializeNodeAnalysis(child, indent + 1)
    }
  }

  return result
}

function runLinter(nodeIds: string[]): Promise<LintResult[]> {
  return new Promise((resolve, reject) => {
    const listener = (
      event: MessageEvent<{ pluginMessage: PluginMessage }>
    ) => {
      const msg = event.data.pluginMessage
      if (msg.type === 'lint-result' && msg.source === 'chat-view') {
        resolve(msg.results)
        window.removeEventListener('message', listener)
      } else if (msg.type === 'error') {
        reject(new Error(msg.message))
        window.removeEventListener('message', listener)
      }
    }

    window.addEventListener('message', listener)
    postPluginMessage({ type: 'run-linter', nodeIds, source: 'chat-view' })

    setTimeout(() => {
      window.removeEventListener('message', listener)
      reject(new Error('Linter timeout'))
    }, 30000)
  })
}

export function useLinterTool(): Record<string, Tool> {
  const runLinterTool = useMemo(() => {
    return tool({
      description: `選択中のデザイン要素をSerendie Design Systemの規約に基づいて検証します。
デザイントークンの適用状況やカラーペアリングの適切性などをチェックし、具体的な問題点と改善提案を返します。
ユーザーが「このデザインは正しい？」「何か問題ある？」などと尋ねた場合に使用してください。`,
      inputSchema: runLinterParams,
      execute: async ({ nodeIds }: z.infer<typeof runLinterParams>) => {
        const results = await runLinter(nodeIds)

        const summary = results
          .map(result => {
            const issuesText =
              result.issues.length > 0
                ? result.issues.map(issue => serializeIssues(issue)).join('\n')
                : '問題なし'

            const analysisText = serializeNodeAnalysis(result.analysis)

            return `## ${result.name} (ID: ${result.id})
検証ノード数: ${result.totalNodes}
検出された問題数: ${result.issues.length}

### 要素の構造とデザイントークン
${analysisText}

### 検出された問題
${issuesText}`
          })
          .join('\n\n---\n\n')

        return summary
      },
    })
  }, [])

  return {
    ['run-linter']: runLinterTool,
  }
}
