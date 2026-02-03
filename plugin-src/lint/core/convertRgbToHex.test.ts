import { convertRgbToHex } from './convertRgbToHex'

describe('convertRgbToHex', () => {
  it('黒 (0,0,0) → #000000', () => {
    expect(convertRgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000')
  })

  it('白 (1,1,1) → #ffffff', () => {
    expect(convertRgbToHex({ r: 1, g: 1, b: 1 })).toBe('#ffffff')
  })

  it('赤 (1,0,0) → #ff0000', () => {
    expect(convertRgbToHex({ r: 1, g: 0, b: 0 })).toBe('#ff0000')
  })

  it('中間値を正しく変換', () => {
    expect(convertRgbToHex({ r: 0.5, g: 0.5, b: 0.5 })).toBe('#808080')
  })

  it('各チャネルが1桁hexの場合もゼロ埋め', () => {
    expect(convertRgbToHex({ r: 1 / 255, g: 2 / 255, b: 3 / 255 })).toBe(
      '#010203'
    )
  })
})
