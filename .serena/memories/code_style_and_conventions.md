# コードスタイルと規約

## TypeScript設定
- **strictモード**: 有効（厳密な型チェック）
- **ターゲット**: ES2016
- **JSX**: React形式（Figma Widget用）
  - jsxFactory: `figma.widget.h`
  - jsxFragmentFactory: `figma.widget.Fragment`

## Prettier設定
- **インデント**: スペース2つ
- **セミコロン**: なし
- **シングルクォート**: 使用
- **末尾カンマ**: ES5準拠
- **改行コード**: LF
- **1行の最大文字数**: 80文字
- **JSX内のクォート**: シングルクォート

## ESLint設定
- **ベース**: eslint:recommended
- **TypeScript**: @typescript-eslint/recommended
- **Figma**: @figma/figma-plugins/recommended
- **未使用変数**: アンダースコア(`_`)で始まる変数は許可

## 命名規則
- **コンポーネント**: PascalCase（例: `Button.tsx`, `Typography.tsx`）
- **ユーティリティ**: camelCase（例: `generateObject.ts`, `notify.ts`）
- **定数**: UPPER_SNAKE_CASE または camelCase
- **型定義**: PascalCase

## ファイル構成
- コンポーネントは `widget-src/components/` に配置
- ユーティリティは `widget-src/utils/` に配置
- モデルは `widget-src/models/` に配置
- スタイルは独立した `styles.ts` ファイルに定義

## インポート
- 相対パスを使用
- 型のインポートは `import type` を使用することが推奨