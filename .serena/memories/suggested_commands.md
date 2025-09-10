# 開発コマンド一覧

## ビルドコマンド

- `npm run build` - Serendieドキュメントを取得し、ウィジェットをバンドル
- `npm run build:fetch` - Serendie Webからドキュメントを取得
- `npm run build:bundle` - TypeScriptコードをバンドル
- `npm run watch` - ファイル変更を監視して自動ビルド

## 品質チェック

- `npm run lint` - ESLintでコードをチェック
- `npm run lint:fix` - ESLintで自動修正
- `npm run format` - ESLint + Prettierでコード整形
- `npm run tsc` - TypeScriptの型チェック（コンパイルなし）

## タスク完了時に実行すべきコマンド

1. `npm run tsc` - 型エラーの確認
2. `npm run lint` - コーディング規約の確認
3. `npm run format` - コード整形

## インストール

- `npm install` - 依存関係のインストール

## システムコマンド（macOS）

- `ls` - ディレクトリ内容の表示
- `cat` - ファイル内容の表示
- `grep` - テキスト検索
- `find` - ファイル検索
- `git status` - Git状態確認
- `git diff` - 変更差分確認
