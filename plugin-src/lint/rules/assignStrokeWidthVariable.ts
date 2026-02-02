import { CUSTOM_VALUE, RuleResult } from '../../../shared-src/models/Rules'
import extractStrokeWidthRole from '../core/extractStrokeWidthRole'

export default function validate(
  strokeWeight: string | null
): RuleResult | null {
  if (!strokeWeight) return null

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
