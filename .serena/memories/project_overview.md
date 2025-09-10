# プロジェクト概要

## プロジェクト名

spread-system-widget

## 目的

Figma Widget/Plugin ツール - デザインシステムとコンポーネントの管理を行うFigmaウィジェット

## 主要技術スタック

- **言語**: TypeScript
- **フレームワーク**: Figma Widget API 1.0.0
- **ビルドツール**: esbuild
- **パッケージマネージャー**: npm
- **依存関係**:
  - @serendie/design-token: デザイントークンシステム
  - openai: AI機能の統合
  - zod: スキーマ検証

## プロジェクト構成

- GitHubからSerendie WebとDesign Tokensのリソースを取得
- MCPサーバー経由でSerendie UIコンポーネント情報にアクセス
- FigmaのFrameから選択された要素を分析
- Pluginでコンポーネントを生成し、Widgetで表示

## ディレクトリ構造

```
/
├── widget-src/           # ウィジェットのソースコード
│   ├── assets/          # 取得したSerendieドキュメント
│   ├── components/      # UIコンポーネント (Button, Typography)
│   ├── models/          # データモデル (ClientStorage)
│   ├── utils/           # ユーティリティ関数
│   ├── code.tsx         # メインエントリーポイント
│   ├── styles.ts        # スタイル定義
│   └── tsconfig.json    # TypeScript設定
├── scripts/             # ビルドスクリプト
│   └── fetch-documents.js  # Serendieドキュメントの取得
├── dist/                # ビルド出力
└── manifest.json        # Figmaプラグイン設定
```
