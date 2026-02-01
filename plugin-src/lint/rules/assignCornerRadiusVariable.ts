import { UNEXPECTED, RuleResult } from '../../../shared-src/models/Rules'

export default function validate(
  cornerRadius: string | null
): RuleResult | null {
  if (!cornerRadius) return null

  if (cornerRadius === UNEXPECTED) {
    return {
      severity: 'warning',
      message: '角丸にデザイントークンを使えます',
      messageDetails:
        '角丸にデザインシステムのバリアブルを設定してください。',
    }
  }

  return null
}
