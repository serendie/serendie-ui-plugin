import { findClosestNumericOption } from './findClosestNumericOption'

describe('findClosestNumericOption', () => {
  it.each([
    [15, ['8', '16', '24'], '16'],
    [21, ['8', '16', '24'], '24'],
    [8, ['8', '16', '24'], '8'],
    [100, ['8', '16', '24'], '24'],
    [0, ['8', '16', '24'], '8'],
  ])('value=%d, options=%j → %s', (value, options, expected) => {
    expect(findClosestNumericOption(value, options)).toBe(expected)
  })

  it('数値オプションがない場合はundefined', () => {
    expect(findClosestNumericOption(10, ['small', 'medium', 'large'])).toBe(
      undefined
    )
  })

  it('空配列はundefined', () => {
    expect(findClosestNumericOption(10, [])).toBe(undefined)
  })

  it('数値と文字列が混在する場合は数値のみ対象', () => {
    expect(findClosestNumericOption(15, ['small', '16', 'large'])).toBe('16')
  })
})
