export type RGB = { r: number; g: number; b: number }

export function colorDistance(a: RGB, b: RGB): number {
  return (a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2
}
