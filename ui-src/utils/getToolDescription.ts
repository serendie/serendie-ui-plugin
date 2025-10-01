export default function getToolDescription(toolName: string): string {
  switch (toolName) {
    case 'get-serendie-ui-overview':
      return 'Serendie UIの概要を取得しました'
    default:
      return `${toolName}を実行しました`
  }
}
