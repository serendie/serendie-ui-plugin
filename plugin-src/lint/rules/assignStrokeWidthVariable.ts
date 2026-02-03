import { CUSTOM_VALUE, RuleResult } from '../../../shared-src/models/Rules'
import extractStrokeWidthRole from '../core/extractStrokeWidthRole'

function validateSingle(strokeWeight: string): RuleResult | null {
  if (strokeWeight === CUSTOM_VALUE) {
    return {
      severity: 'warning',
      message: '線幅にデザイントークンを使えます',
      messageDetails:
        '線幅にデザインシステムのバリアブルを設定してください。',
    }
  }

  const role = extractStrokeWidthRole(strokeWeight)
  if (!role) {
    return {
      severity: 'warning',
      message: '線幅にデザイントークンを使えます',
      messageDetails:
        '線幅にデザインシステムのバリアブルを設定してください。',
    }
  }

  return null
}

export default function validate(
  strokeWeight: string | string[] | null
): RuleResult | null {
  if (!strokeWeight) return null

  if (Array.isArray(strokeWeight)) {
    for (const sw of strokeWeight) {
      const result = validateSingle(sw)
      if (result) return result
    }
    return null
  }

  return validateSingle(strokeWeight)
}
