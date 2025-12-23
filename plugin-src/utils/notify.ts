export default function notify(message: string) {
  figma.notify(message, { timeout: 3000 })
}
