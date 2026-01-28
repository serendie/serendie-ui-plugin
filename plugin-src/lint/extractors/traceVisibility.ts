export default function traceVisibility(node: SceneNode): boolean {
  if (node.visible === false) {
    return false
  }

  if (
    node.parent &&
    node.parent.type !== 'PAGE' &&
    node.parent.type !== 'DOCUMENT'
  ) {
    return traceVisibility(node.parent as SceneNode)
  }

  return true
}
