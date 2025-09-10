export default async function getImage(node: FrameNode) {
  const imageData = await node.exportAsync({
    format: 'PNG',
    constraint: { type: 'SCALE', value: 2 },
  })
  const base64 = figma.base64Encode(imageData)
  return `data:image/png;base64,${base64}`
}
