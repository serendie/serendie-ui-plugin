import {
  ComponentKeysMap,
  ComponentKeyInfo,
} from '../../../shared-src/models/ComponentKeys'
import { findClosestNumericOption } from '../../../shared-src/utils/findClosestNumericOption'
import { getBasePropName } from '../../../shared-src/utils/getBasePropName'
import {
  isNestedProperty,
  parseNestedProperty,
} from '../../../shared-src/utils/nestProperty'
import { parseInstanceSwapValue } from '../../../shared-src/utils/parseInstanceSwapValue'
import { applyFigmaSpecificDefaults } from './applyFigmaSpecificDefaults'
import { findDescendantByName } from '../nodes/findDescendantByName'
import componentKeys from '../../../shared-src/assets/component-keys.json'

const componentKeysMap = componentKeys as ComponentKeysMap

/**
 * ネストしたプロパティを適用
 */
function applyNestedProperties(
  instance: InstanceNode,
  nestedProps: Record<string, string | boolean | number>
): void {
  for (const [key, value] of Object.entries(nestedProps)) {
    const parsed = parseNestedProperty(key)
    if (!parsed) continue

    let current: SceneNode = instance
    let found = true

    for (const name of parsed.path) {
      const child = findDescendantByName(current, name)
      if (!child) {
        console.warn(
          `Nested property path not found: ${key} (looking for ${name})`
        )
        found = false
        break
      }
      current = child
    }

    if (!found) continue

    if (current.type === 'INSTANCE') {
      try {
        current.setProperties({ [parsed.propName]: String(value) })
      } catch (e) {
        console.warn(`Failed to set nested property: ${key}`, e)
      }
    } else {
      console.warn(
        `Nested property target is not an INSTANCE: ${key} (type: ${current.type})`
      )
    }
  }
}

/**
 * インスタンスにプロパティを適用する
 * AIが返したプロパティを正規化し、適切な順序で適用する
 */
export async function setInstanceProperties(
  instance: InstanceNode,
  properties: Record<string, string | boolean | number>,
  componentKeyInfo: ComponentKeyInfo,
  componentName: string
): Promise<void> {
  // Figma固有の冗長プロパティを自動補完
  const normalizedProperties = applyFigmaSpecificDefaults(
    componentName,
    properties
  )

  // プロパティを種類別に分類
  const variantProps: Record<string, string> = {}
  const textProps: Record<string, string> = {}
  const booleanProps: Record<string, boolean> = {}
  const instanceSwapProps: Array<{ propName: string; componentKey: string }> =
    []
  const nestedProps: Record<string, string | boolean | number> = {}

  for (const [key, value] of Object.entries(normalizedProperties)) {
    // ネストしたプロパティは別途処理
    if (isNestedProperty(key)) {
      nestedProps[key] = value
      continue
    }

    // プロパティ名のマッチング（#以降のIDを無視して比較）
    const propDef = componentKeyInfo.componentProperties?.find(
      p => getBasePropName(p.name).toLowerCase() === key.toLowerCase()
    )
    if (!propDef) {
      console.warn(`Skipping unknown property for ${componentName}: ${key}`)
      continue
    }

    switch (propDef.type) {
      case 'VARIANT': {
        const strValue = String(value)
        let matched = propDef.options.find(
          opt => opt.toLowerCase() === strValue.toLowerCase()
        )

        // 数値オプションなら最も近い値にフォールバック
        if (!matched) {
          const numValue = Number(value)
          if (!isNaN(numValue)) {
            const closest = findClosestNumericOption(numValue, propDef.options)
            if (closest) {
              matched = closest
              console.log(
                `Variant value ${value} not found, using closest: ${matched}`
              )
            }
          }
        }

        if (matched) {
          variantProps[propDef.name] = matched
        } else {
          console.warn(
            `Skipping invalid variant value for ${propDef.name}: ${value}`
          )
        }
        break
      }
      case 'BOOLEAN':
        booleanProps[propDef.name] =
          value === true || value === 'true' || value === 'True'
        break
      case 'TEXT':
        textProps[propDef.name] = String(value)
        break
      case 'INSTANCE_SWAP': {
        const parsed = parseInstanceSwapValue(String(value))
        if (!parsed) continue

        const targetComponentSet = componentKeysMap[parsed.componentSetName]
        if (
          !targetComponentSet ||
          targetComponentSet.type !== 'COMPONENT_SET'
        ) {
          continue
        }

        const importedSet = await figma.importComponentSetByKeyAsync(
          targetComponentSet.key
        )
        const variantComponent = importedSet.children.find(child => {
          if (child.type !== 'COMPONENT') return false
          return child.name
            .split(', ')
            .some(
              part =>
                part.toLowerCase() ===
                `name=${parsed.variantValue.toLowerCase()}`
            )
        }) as ComponentNode | undefined

        if (variantComponent) {
          instanceSwapProps.push({
            propName: propDef.name,
            componentKey: variantComponent.key,
          })
        }
        break
      }
    }
  }

  // Step 1: VARIANTを先に適用（構造が変わるため）
  if (Object.keys(variantProps).length > 0) {
    instance.setProperties(variantProps)
  }

  // Step 2: TEXT/BOOLEANを適用
  const otherProps: Record<string, string | boolean> = { ...booleanProps }

  if (Object.keys(textProps).length > 0) {
    const currentProps = instance.componentProperties

    for (const [propName, value] of Object.entries(textProps)) {
      if (propName in currentProps) {
        otherProps[propName] = value
      } else {
        const baseName = getBasePropName(propName)
        const matchingProp = Object.keys(currentProps).find(
          p => getBasePropName(p) === baseName
        )
        if (matchingProp) {
          otherProps[matchingProp] = value
        } else {
          console.warn(
            `Text property not found in current variant: ${propName}`
          )
        }
      }
    }
  }

  if (Object.keys(otherProps).length > 0) {
    instance.setProperties(otherProps)
  }

  // Step 3: INSTANCE_SWAPを適用
  for (const { propName, componentKey } of instanceSwapProps) {
    const swappedComponent = await figma.importComponentByKeyAsync(componentKey)
    instance.setProperties({
      [propName]: swappedComponent.id,
    })
  }

  // Step 4: ネストしたプロパティを適用
  if (Object.keys(nestedProps).length > 0) {
    applyNestedProperties(instance, nestedProps)
  }
}
