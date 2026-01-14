import { IssueDetail } from '../../shared-src/models/Rules'
import extractColorRole from '../core/extractColorRole'

export default function validate(
  backgroundColor: string | null
): IssueDetail | null {
  if (!backgroundColor || backgroundColor.match(/^sd\/reference/)) {
    return null
  }

  const backgroundRole = extractColorRole(backgroundColor)
  if (!backgroundRole) {
    return {
      severity: 'warning',
      message: '背景色にシステムトークンを未使用',
      suggestion: '塗りにデザインシステムのバリアブルを設定してください。',
    }
  }

  if (backgroundColor.match(/^on/) || backgroundColor.match(/^\w+On[A-Z]/)) {
    return {
      severity: 'error',
      message: '背景色が不適切',
      suggestion:
        '塗りには"on"という名前が含まれるバリアブルを設定しないでください。',
    }
  }

  return null
}
