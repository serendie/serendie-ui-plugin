import { IssueDetail, MANUAL_VALUE } from '../../shared-src/models/Rules'

export default function validate(textColor: string | null): IssueDetail | null {
  if (textColor === MANUAL_VALUE) {
    return {
      severity: 'warning',
      message: 'テキスト色がバリアブル以外',
      suggestion: '塗りにデザインシステムのバリアブルを設定してください。',
    }
  }

  return null
}
