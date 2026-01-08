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
    case 'search-serendie-guideline':
      return 'Serendie Design Systemのガイドラインを検索しました'
    case 'search-component-docs':
      return 'Ark UIや他のコンポーネントの事例を検索しました'
    case 'search-design-token-docs':
      return 'Material Design 3のデザイントークンに関する資料を検索しました'
    case 'run-linter':
      return '選択中の要素を検証しました'
    default:
      return `${toolName}を実行しました`
  }
}
