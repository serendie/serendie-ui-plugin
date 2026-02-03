import { isNestedProperty, parseNestedProperty } from './nestProperty'

describe('isNestedProperty', () => {
  it.each([
    ['Parent/Child.Name', true],
    ['A/B/C.Prop', true],
    ['Name', false],
    ['Parent/Child', false],
    ['Name.Prop', false],
  ])('%s → %s', (key, expected) => {
    expect(isNestedProperty(key)).toBe(expected)
  })
})

describe('parseNestedProperty', () => {
  it.each([
    ['Parent/Child.Name', { path: ['Parent', 'Child'], propName: 'Name' }],
    ['A/B/C.Prop', { path: ['A', 'B', 'C'], propName: 'Prop' }],
    ['Parent/Child', null],
  ])('%s', (key, expected) => {
    expect(parseNestedProperty(key)).toEqual(expected)
  })
})
