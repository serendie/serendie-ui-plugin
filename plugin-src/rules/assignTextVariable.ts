import { IssueDetail } from '../../shared-src/models/Rules'
import extractColorRole from '../utils/extractColorRole'

export default function validate(textColor: string | null): IssueDetail | null {
  if (!textColor) {
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

  if (!textRole.match(/^on/)?.[0] && !textRole.match(/^\w+On[A-Z]/)) {
    return {
      severity: 'error',
      message: 'テキスト色が不適切',
      suggestion:
        '塗りにはonから始まるデザインシステムのバリアブルを設定してください。',
    }
  }

  return null
}
