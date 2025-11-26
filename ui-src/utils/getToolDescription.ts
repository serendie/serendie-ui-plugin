export default function getToolDescription(toolName: string): string {
  switch (toolName) {
    case 'get-serendie-ui-overview':
      return 'Serendie UIの概要を取得しました'
    case 'get-components':
      return 'Serendie UIのコンポーネント一覧を取得しました'
    case 'get-symbols':
      return 'Serendie UIのシンボル一覧を取得しました'
    case 'get-design-tokens':
      return 'Serendie Design Tokenの一覧を取得しました'
    case 'get-component-detail':
      return 'コンポーネントの詳細情報を取得しました'
    case 'get-symbol-detail':
      return 'シンボルの詳細情報を取得しました'
    case 'get-design-token-detail':
      return 'デザイントークンの詳細情報を取得しました'
    case 'search-component-docs':
      return 'コンポーネントに関するドキュメントを検索しました'
    case 'search-design-token-docs':
      return 'デザイントークンに関するドキュメントを検索しました'
    default:
      return `${toolName}を実行しました`
  }
}
