import { IssueDetail } from '../../shared-src/models/Rules'
import extractColorRole from '../core/extractColorRole'

export default function validate(textColor: string | null): IssueDetail | null {
  if (!textColor || textColor.match(/^sd\/reference/)) {
    return null
  }

  const textRole = extractColorRole(textColor)
  if (!textRole) {
    return {
      severity: 'warning',
      message: 'テキスト色がバリアブル以外',
      suggestion: '塗りにデザインシステムのバリアブルを設定してください。',
    }
  }

  if (
    [
      'primary',
      'secondary',
      'tertiary',
      'notice',
      'negative',
      'positive',
    ].includes(textRole)
  ) {
    return null
  }

  if (!textRole.match(/^on/) && !textRole.match(/^\w+On[A-Z]/)) {
    return {
      severity: 'error',
      message: 'テキスト色が不適切',
      suggestion:
        '塗りには"on"という名前が含まれるデザインシステムのバリアブルを設定してください。',
    }
  }

  return null
}
