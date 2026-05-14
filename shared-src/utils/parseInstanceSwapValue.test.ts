import { parseInstanceSwapValue } from './parseInstanceSwapValue'

describe('parseInstanceSwapValue', () => {
  it.each([
    [
      'OutlinedSerendieSymbols/arrow_back',
      {
        componentSetName: 'OutlinedSerendieSymbols',
        variantValue: 'arrow_back',
      },
    ],
    ['Icon/settings', { componentSetName: 'Icon', variantValue: 'settings' }],
    ['NoSlash', null],
    ['', null],
  ])('%s', (value, expected) => {
    expect(parseInstanceSwapValue(value)).toEqual(expected)
  })
})
