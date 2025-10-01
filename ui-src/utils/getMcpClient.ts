import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

let client: Client | null = null

export default async function getMcpClient() {
  if (client) return client

  client = new Client({ name: 'serendie-design-linter', version: '1.0.0' })
  await client.connect(
    new StreamableHTTPClientTransport(new URL('https://serendie.design/mcp'))
  )
  return client
}
