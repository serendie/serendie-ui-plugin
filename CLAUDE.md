# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## セットアップ

1. `npm install`
2. `.env.local` を作成（`.env.example` を参照）
3. `npm run build`
4. Figma Desktop App → Plugins → Development → Import plugin from manifest → `manifest.json` を選択

### 環境変数（.env.local）

- `DOCS_SEARCH_API_KEY`: チャット機能でSerendieドキュメントを検索するためのAPI
- `FIGMA_PERSONAL_ACCESS_TOKEN`: ビルド時にSerendie UI Kitのコンポーネント情報を取得（library_content:readスコープ必須）
- `FIGMA_SERENDIE_UI_KIT_FILE_KEY`: Serendie UI KitのFigmaファイルキー

### ユーザー入力（プラグインUI）

- OpenAI APIキー: AIによるコンポーネント提案機能で使用

## プロジェクト概要

Spread System Linterは、Figmaデザイン内でSerendie Design Systemの規約に準拠しているかを検証するFigma Pluginです。

### 主要機能

1. **デザイン変数の検証**
   - テキストノードへの変数適用チェック
   - フレームノードへの変数適用チェック
   - カラーペアリングの適切性検証

2. **カラー関係性の検証**
   - テキストと背景色の組み合わせが適切かチェック
   - Serendie Design Systemのカラーロール（primary/onPrimary等）に基づく検証
   - Material Design 3準拠のカラーペアリング規則

3. **Figma Plugin アーキテクチャ**
   - `plugin-src/`: バックエンド処理（Figma API操作、検証ロジック）
   - `ui-src/`: フロントエンドUI（React + @serendie/ui）
   - `shared-src/`: 共有モデルとユーティリティ

4. **UIコンポーネント**
   - @serendie/uiライブラリを活用したUIコンポーネント
   - インラインスタイルによる実装（Figma環境の制約により）
   - チャットビューとイシューリストの実装

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
├── code.ts                          # Pluginメインエントリー、Figma API操作
├── lint/                            # Lint機能（将来外部サーバーに移植予定）
│   ├── core/
│   │   └── extractColorRole.ts      # カラーロール抽出
│   ├── rules/
│   │   ├── assignTextVariable.ts    # テキスト変数ルール定義
│   │   ├── assignFrameVariable.ts   # フレーム変数ルール定義
│   │   └── colorPairing.ts          # カラーペアリングルール定義
│   ├── validators/
│   │   ├── validateAssignTextVariable.ts   # テキスト変数検証
│   │   ├── validateAssignFrameVariable.ts  # フレーム変数検証
│   │   └── validateColorPairing.ts         # カラーペアリング検証
│   └── extractors/                  # 色・変数抽出
│       ├── extractColorInfo.ts      # ノードからカラー情報を抽出
│       ├── extractColorVariables.ts # カラー変数抽出
│       ├── extractVariableKey.ts    # 変数キーの抽出とライブラリ判定
│       ├── traceFillDefinition.ts   # 塗りつぶし定義のトレース
│       ├── traceVisibility.ts       # 可視性のトレース
│       └── getVariableMap.ts        # Figma変数のマッピング取得
└── utils/                           # Figma Plugin専用ユーティリティ
    ├── components/                  # コンポーネント適用関連
    │   ├── applyComponent.ts        # コンポーネント適用メイン
    │   ├── setInstanceProperties.ts # インスタンスプロパティ設定
    │   ├── applyFigmaSpecificDefaults.ts # Figma固有のデフォルト適用
    │   └── detachAllInstances.ts    # インスタンスのデタッチ
    └── nodes/                       # ノード操作
        ├── buildNodeStructure.ts    # ノード構造構築
        ├── getTreePath.ts           # ツリーパス取得
        ├── sortByDepth.ts           # 深さ順ソート
        ├── findDescendantByName.ts  # 名前で子孫ノードを検索
        └── notify.ts                # 通知ユーティリティ

ui-src/
├── index.tsx                    # UIエントリーポイント
├── App.tsx                      # メインUIコンポーネント
├── components/
│   ├── chat/                    # チャットUI
│   └── lint/                    # LintUI
├── hooks/
│   ├── useComponentValidation.ts # コンポーネント検証フック
│   └── ...                      # その他フック
├── models/
│   ├── componentValidationSchema.ts # コンポーネント検証スキーマ
│   └── ...                      # その他モデル
├── utils/
│   └── serializeNodeStructure.ts # ノード構造のシリアライズ
├── build-html.mjs               # HTMLバンドル生成
└── template.html                # HTMLテンプレート

shared-src/
├── models/
│   ├── Rules.ts                 # ルール型定義とイシュー型
│   ├── PluginMessage.ts         # プラグインメッセージ型
│   └── ComponentKeys.ts         # コンポーネントキー型
├── utils/
│   ├── getImage.ts              # 画像取得ユーティリティ
│   ├── serializeBoxShadow.ts    # ボックスシャドウのシリアライズ
│   ├── getBasePropName.ts       # プロパティ名のベース取得
│   ├── findClosestNumericOption.ts # 最も近い数値オプション検索
│   ├── nestProperty.ts          # ネストプロパティ処理
│   └── parseInstanceSwapValue.ts # インスタンススワップ値のパース
└── assets/
    ├── components_manifest.json # コンポーネントマニフェスト
    └── component-keys.json      # コンポーネントキー（ビルド時生成）

scripts/
└── fetch-component-keys.ts      # コンポーネントキー取得
```

## 重要な実装パターン

### Figma Plugin API

- Plugin側: `figma.showUI()` でUIを表示
- UI側: `parent.postMessage()` でPlugin側と通信
- 型安全な通信: `PluginMessage` 型で定義

### Figma Sandbox の制約と対策

Figma Plugin の sandbox はシングルスレッドで動作し、重い処理中は UI 更新がブロックされる。

- **yieldToUI**: `setTimeout(resolve, 0)` でイベントループに制御を返し、UI 更新を許可
- **チャンク処理**: 大量の処理を `CHUNK_SIZE` 単位で分割し、各チャンク間で `yieldToUI` を呼ぶ
- **インポートキャッシュ**: `importVariableCached`, `importComponentByKeyCached` 等で Promise をキャッシュし重複呼び出しを防止
- **並列化**: 独立した非同期処理は `Promise.all` で一括実行

### UIコンポーネントとスタイリング

```typescript
// @serendie/uiコンポーネントの使用
import { Button, TextField } from '@serendie/ui'

// デザイントークンを使用したインラインスタイル（Figma Plugin環境の制約）
import tokens from '@serendie/design-token'
const { sd } = tokens

// Panda CSSは開発環境でのみ使用、実際のスタイリングはインラインで実装
const styles = {
  padding: sd.system.dimension.spacing.medium, // 16px
  borderRadius: sd.system.dimension.radius.medium, // 8px
  backgroundColor: sd.system.color.component.surface, // 背景色
  color: sd.system.color.component.onSurface, // テキスト色
  gap: sd.system.dimension.spacing.extraSmall, // 8px
}
```

### 検証ルール

#### 変数適用ルール

- テキストノード: カラー変数の適用必須（LIBRARY_NAMEから）
- フレームノード: 塗りつぶしカラー変数の適用必須
- Manual Valueは警告対象

#### カラーペアリングルール

- COLOR_RULES定義に基づくペアリング検証
- 前景色には「on」プレフィックス
- 大面積背景色には「Container」サフィックス
- 背景色のトレース機能で親ノードから継承

### ESLint設定

- package.json内の`eslintConfig`で一元管理
- `ignorePatterns`で除外ファイルを指定
- TypeScript strictモードとFigma plugins推奨設定

## セキュリティ考慮事項

- manifest.jsonで`networkAccess`は制限されている
- APIキーなどの機密情報はコードに含めない
- 外部リソースの取得はビルド時のみ実行

## デバッグとテスト

- Figma上でプラグインを直接テスト
- Console APIを使用したデバッグ（本番環境では削除）
- 型安全性はTypeScriptコンパイラで保証
- Jest + ts-jestによる単体テスト
- `npm test`でテスト実行、`npm test:watch`で監視モード

## 将来の移植計画

`plugin-src/lint/` 配下のコードは将来外部サーバーに移植予定です。そのため、Figma Plugin APIに依存しないよう設計されています。
