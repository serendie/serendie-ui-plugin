# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Spread System Widgetは、Figma上でデザインシステムの管理とコンポーネント生成を行うためのWidget/Pluginツールです。

### アーキテクチャ

このプロジェクトは以下のワークフローで動作します：

1. **外部リソースの取得**
   - GitHub上のSerendie Webからドキュメント（MDX）を取得
   - デザイントークンシステム（@serendie/design-token）の利用

2. **Figmaとの連携**
   - Frameから選択された要素（画像、全ノード構造）を取得
   - Pluginで分析とキー管理を実行
   - Widgetでカラー検証とアノテーション追加を提供

3. **コンポーネント生成**
   - 取得したノード構造を解析
   - 該当するSerendieコンポーネント（種類、XY座標、色、バリアブルID）を特定
   - WidgetでのUIレンダリング

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
widget-src/
├── code.tsx          # メインエントリー、Figma APIとの接続
├── components/       # 再利用可能なUIコンポーネント
├── models/          # データモデルとストレージ管理
├── utils/           # ユーティリティ関数
└── assets/          # 取得したSerendieドキュメント
```

## 重要な実装パターン

### Figma Widget API
- JSXファクトリ: `figma.widget.h`
- フラグメント: `figma.widget.Fragment`
- コンポーネントは関数型で定義

### 状態管理
- `useSyncedState`: Widget間で同期される状態
- `usePropertyMenu`: プロパティメニューの定義
- ClientStorage: ローカルストレージの管理

### 外部リソースの統合
- `scripts/fetch-documents.js`: ビルド時にSerendieドキュメントを取得

## セキュリティ考慮事項

- manifest.jsonで`networkAccess`は制限されている
- APIキーなどの機密情報はコードに含めない
- 外部リソースの取得はビルド時のみ実行

## デバッグとテスト

- Figma上でWidgetを直接テスト
- Console APIを使用したデバッグ（本番環境では削除）
- 型安全性はTypeScriptコンパイラで保証