import { Issue } from '../../../shared-src/models/Rules'
import { ColorInfo } from '../extractors/extractColorInfo'
import { BorderInfo } from '../extractors/extractBorderInfo'
import validateColorPairing from './validateColorPairing'
import validateAssignTextVariable from './validateAssignTextVariable'
import validateAssignFrameVariable from './validateAssignFrameVariable'
import validateAssignStrokeColorVariable from './validateAssignStrokeColorVariable'
import validateAssignStrokeWidthVariable from './validateAssignStrokeWidthVariable'
import validateAssignCornerRadiusVariable from './validateAssignCornerRadiusVariable'

export function runLint(
  colorInfoList: ColorInfo[],
  borderInfoList: BorderInfo[]
): Issue[] {
  return [
    ...validateColorPairing(colorInfoList).issues,
    ...validateAssignTextVariable(colorInfoList).issues,
    ...validateAssignFrameVariable(colorInfoList).issues,
    ...validateAssignStrokeColorVariable(borderInfoList).issues,
    ...validateAssignStrokeWidthVariable(borderInfoList).issues,
    ...validateAssignCornerRadiusVariable(borderInfoList).issues,
  ]
}
