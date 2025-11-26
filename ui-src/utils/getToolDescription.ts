export default function getToolDescription(toolName: string): string {
  switch (toolName) {
    case 'get-serendie-ui-overview':
      return 'Serendie UIの概要を取得しました'
    case 'get-components':
      return 'Serendie UIのコンポーネント一覧を取得しました'
    case 'search-component-docs':
      return 'コンポーネントに関するドキュメントを検索しました'
    case 'search-design-token-docs':
      return 'デザイントークンに関するドキュメントを検索しました'
    default:
      return `${toolName}を実行しました`
  }
}
