import { Issue } from '../../../shared-src/models/Rules'
import { ColorInfo } from '../extractors/extractColorInfo'
import validateColorPairing from './validateColorPairing'
import validateAssignTextVariable from './validateAssignTextVariable'
import validateAssignFrameVariable from './validateAssignFrameVariable'

export function runLint(colorInfoList: ColorInfo[]): Issue[] {
  return [
    ...validateColorPairing(colorInfoList).issues,
    ...validateAssignTextVariable(colorInfoList).issues,
    ...validateAssignFrameVariable(colorInfoList).issues,
  ]
}
