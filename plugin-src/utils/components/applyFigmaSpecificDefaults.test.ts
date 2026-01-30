import { applyFigmaSpecificDefaults } from './applyFigmaSpecificDefaults'

describe('applyFigmaSpecificDefaults', () => {
  describe('TopAppBar', () => {
    it.each([
      // Type に応じて Navbar を設定
      [{ Type: 'TitleWithIcons' }, { Type: 'TitleWithIcons', Navbar: false }],
      [{ Type: 'TitleOnly' }, { Type: 'TitleOnly', Navbar: false }],
      [{ Type: 'Navbar' }, { Type: 'Navbar', Navbar: true }],

      // 矛盾する値は上書き
      [
        { Type: 'TitleWithIcons', Navbar: true },
        { Type: 'TitleWithIcons', Navbar: false },
      ],
      [
        { Type: 'TitleOnly', Navbar: true },
        { Type: 'TitleOnly', Navbar: false },
      ],
      [
        { Type: 'Navbar', Navbar: false },
        { Type: 'Navbar', Navbar: true },
      ],
    ])('%j → %j', (input, expected) => {
      expect(applyFigmaSpecificDefaults('TopAppBar', input)).toEqual(expected)
    })
  })

  it('TopAppBar以外は何もしない', () => {
    const props = { Type: 'TitleWithIcons' }
    expect(applyFigmaSpecificDefaults('Button', props)).toEqual(props)
  })
})
