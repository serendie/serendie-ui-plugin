# タスク完了時のチェックリスト

## 必須実行項目

1. **型チェック**: `npm run tsc`
   - 型エラーがないことを確認
   - 新しいコードがTypeScriptの厳密モードに準拠していることを確認

2. **Lintチェック**: `npm run lint`
   - ESLintエラーがないことを確認
   - Figmaプラグインの推奨ルールに従っていることを確認

3. **コードフォーマット**: `npm run format`
   - Prettierによる自動整形を実行
   - ESLintの自動修正も含む

## 追加確認項目

- **ビルド確認**: `npm run build`
  - エラーなくビルドが完了することを確認
  - dist/code.js が正しく生成されることを確認

- **ウォッチモード**: 開発中は `npm run watch` を使用
  - Visual Studio Codeで作業する場合は、Terminal > Run Build Task から選択

## Gitコミット前

- すべての型エラーが解決済み
- Lintエラーが解決済み
- コードがフォーマット済み
- 不要なconsole.logが削除済み
- セキュリティ上の問題（APIキー、トークンなど）が含まれていない
