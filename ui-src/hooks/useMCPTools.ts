import { experimental_createMCPClient as createMCPClient, Tool } from 'ai'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { useEffect, useState } from 'react'

export function useMCPTools() {
  const [tools, setTools] = useState<Record<string, Tool> | undefined>(
    undefined
  )

  useEffect(() => {
    const init = async () => {
      try {
        const mcp = await createMCPClient({
          transport: new StreamableHTTPClientTransport(
            new URL('https://serendie.design/mcp')
          ),
        })
        const tools = await mcp.tools()
        console.log('MCP Tools:', tools)
        setTools(tools)
      } catch (error) {
        console.error('MCP初期化エラー:', error)
      }
    }
    init()
  }, [])

  return tools
}
