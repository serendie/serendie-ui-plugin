import { CUSTOM_VALUE, RuleResult } from '../../../shared-src/models/Rules'
import extractCornerRadiusRole from '../core/extractCornerRadiusRole'

function validateSingle(cornerRadius: string): RuleResult | null {
  if (cornerRadius === CUSTOM_VALUE) {
    return {
      severity: 'warning',
      message: '角丸にデザイントークンを使えます',
      messageDetails: '角丸にデザインシステムのバリアブルを設定してください。',
    }
  }

  const role = extractCornerRadiusRole(cornerRadius)
  if (!role) {
    return {
      severity: 'warning',
      message: '角丸にデザイントークンを使えます',
      messageDetails: '角丸にデザインシステムのバリアブルを設定してください。',
    }
  }

  return null
}

export default function validate(
  cornerRadius: string | string[] | null
): RuleResult | null {
  if (!cornerRadius) return null

  if (Array.isArray(cornerRadius)) {
    for (const cr of cornerRadius) {
      const result = validateSingle(cr)
      if (result) return result
    }
    return null
  }

  return validateSingle(cornerRadius)
}
