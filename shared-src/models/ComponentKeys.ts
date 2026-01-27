// component-keys.jsonの型定義

// コンポーネントプロパティの型（discriminated union）
export type VariantPropertyDef = {
  name: string
  type: 'VARIANT'
  options: string[]
}

export type BooleanPropertyDef = {
  name: string
  type: 'BOOLEAN'
  defaultValue: boolean
}

export type TextPropertyDef = {
  name: string
  type: 'TEXT'
  defaultValue: string
}

export type ComponentPropertyDef =
  | VariantPropertyDef
  | BooleanPropertyDef
  | TextPropertyDef

export type ComponentKeyInfo = {
  key: string
  name: string
  description: string
  nodeId: string
  type: 'COMPONENT' | 'COMPONENT_SET'
  componentProperties?: ComponentPropertyDef[]
}

export type ComponentKeysMap = Record<string, ComponentKeyInfo>
