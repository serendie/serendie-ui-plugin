# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Spread System Color Linterは、Figmaデザイン内でSerendie Design Systemのカラーロール規約に準拠しているかを検証するFigma Pluginです。

### 主要機能

1. **カラー関係性の検証**
   - テキストと背景色の組み合わせが適切かチェック
   - Serendie Design Systemのカラーロール（primary/onPrimary等）に基づく検証
   - Material Design 3準拠のカラーペアリング規則

2. **Figma Plugin アーキテクチャ**
   - `plugin-src/`: バックエンド処理（Figma API操作）
   - `ui-src/`: フロントエンドUI（React）
   - `shared-src/`: 共有モデルとタイプ定義

3. **デザイントークンの活用**
   - @serendie/design-tokenを直接使用してスタイリング
   - スプレッド演算子でタイポグラフィトークンを適用
   - システムカラー、スペーシング、タイポグラフィロールの活用

## 開発コマンド

### 必須コマンド（タスク完了時に実行）

```bash
npm run tsc      # TypeScript型チェック
npm run lint     # ESLintチェック
npm run format   # コード整形（ESLint + Prettier）
```

### ビルド関連

```bash
npm run build    # ドキュメント取得とバンドルを実行
npm run watch    # 開発時の自動ビルド
```

## コードスタイル

- **セミコロン不要**: Prettierで自動削除
- **シングルクォート使用**: 文字列とJSX属性
- **インデント**: スペース2つ
- **TypeScript strictモード**: 厳密な型チェック有効

## ディレクトリ構造と責務

```
plugin-src/
├── code.ts           # Pluginメインエントリー、Figma API操作
├── extractColors.ts  # ノードからカラー情報を抽出
└── rules/
    └── colorPairing.ts  # カラーペアリング検証ルール

ui-src/
├── index.tsx        # UIエントリーポイント
├── App.tsx          # メインUIコンポーネント
└── build-html.mjs   # HTMLバンドル生成
└── template.html    # HTMLテンプレート

shared-src/
└── models/
    └── ColorValidation.ts  # 共有型定義

assets/
└── serendie-web/    # Serendieドキュメント（MDX）
```

## 重要な実装パターン

### Figma Plugin API

- Plugin側: `figma.showUI()` でUIを表示
- UI側: `parent.postMessage()` でPlugin側と通信
- 型安全な通信: `PluginMessage` 型で定義

### デザイントークンの使用

```typescript
import tokens from '@serendie/design-token'
const { sd } = tokens

// スプレッド演算子でタイポグラフィトークンを適用
style={{
  ...sd.system.typography.headline.small_expanded,
  color: sd.system.color.component.onSurface,
}}
```

### カラー検証ルール

- COLOR_RULES定義に基づくペアリング検証
- 前景色には「on」プレフィックス
- 大面積背景色には「Container」サフィックス

### ESLint設定

- package.json内の`eslintConfig`で一元管理
- `ignorePatterns`で除外ファイルを指定
- TypeScript strictモードとFigma plugins推奨設定

## セキュリティ考慮事項

- manifest.jsonで`networkAccess`は制限されている
- APIキーなどの機密情報はコードに含めない
- 外部リソースの取得はビルド時のみ実行

## デバッグとテスト

- Figma上でWidgetを直接テスト
- Console APIを使用したデバッグ（本番環境では削除）
- 型安全性はTypeScriptコンパイラで保証
