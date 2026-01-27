// component-keys.jsonの型定義
export type ComponentKeyInfo = {
  key: string
  name: string
  description: string
  nodeId: string
  type: 'COMPONENT' | 'COMPONENT_SET'
  variantProperties?: { name: string; options: string[] }[]
}

export type ComponentKeysMap = Record<string, ComponentKeyInfo>
