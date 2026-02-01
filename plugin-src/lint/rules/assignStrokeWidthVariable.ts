import { UNEXPECTED, RuleResult } from '../../../shared-src/models/Rules'

export default function validate(
  strokeWeight: string | null
): RuleResult | null {
  if (!strokeWeight) return null

  if (strokeWeight === UNEXPECTED) {
    return {
      severity: 'warning',
      message: '線幅にデザイントークンを使えます',
      messageDetails:
        '線幅にデザインシステムのバリアブルを設定してください。',
    }
  }

  return null
}
