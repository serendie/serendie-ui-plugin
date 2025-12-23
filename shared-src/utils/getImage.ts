export default async function getImage(node: FrameNode) {
  const imageData = await node.exportAsync({
    format: 'JPG',
    constraint: { type: 'WIDTH', value: 1920 },
  })
  const base64 = figma.base64Encode(imageData)
  return `data:image/jpeg;base64,${base64}`
}

export function canGetImage(node: BaseNode): node is FrameNode {
  return 'exportAsync' in node
}
