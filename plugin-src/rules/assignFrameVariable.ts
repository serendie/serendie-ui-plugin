import { IssueDetail, MANUAL_VALUE } from '../../shared-src/models/Rules'

export default function validate(
  backgroundColor: string | null
): IssueDetail | null {
  if (backgroundColor === MANUAL_VALUE) {
    return {
      severity: 'warning',
      message: '背景色がバリアブル以外',
      suggestion: '塗りにデザインシステムのバリアブルを設定してください。',
    }
  }

  return null
}
