import { UNEXPECTED, RuleResult } from '../../../shared-src/models/Rules'

export default function validate(
  strokeColor: string | null
): RuleResult | null {
  if (!strokeColor) return null

  if (strokeColor === UNEXPECTED) {
    return {
      severity: 'warning',
      message: '線色にデザイントークンを使えます',
      messageDetails:
        '線色にデザインシステムのバリアブルを設定してください。',
    }
  }

  return null
}
