import { CUSTOM_VALUE, RuleResult } from '../../../shared-src/models/Rules'
import extractColorRole from '../core/extractColorRole'

export default function validate(
  strokeColor: string | null
): RuleResult | null {
  if (!strokeColor) return null

  if (strokeColor === CUSTOM_VALUE) {
    return {
      severity: 'warning',
      message: '線色にデザイントークンを使えます',
      messageDetails: '線色にデザインシステムのバリアブルを設定してください。',
    }
  }

  const role = extractColorRole(strokeColor)
  if (!role) {
    return {
      severity: 'warning',
      message: '線色にデザイントークンを使えます',
      messageDetails: '線色にデザインシステムのバリアブルを設定してください。',
    }
  }

  return null
}
