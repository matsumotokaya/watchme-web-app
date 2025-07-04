# WatchMe v8 デプロイ手順

## 📦 プロダクションビルド

### 1. 設定確認
- `vite.config.js` で `base: '/product/dist/'` が設定されていることを確認
- `src/services/fileStorageService.js` で本番APIエンドポイントが設定されていることを確認

### 2. ビルド実行
```bash
npm run build
```

### 3. 生成されるファイル
- `dist/index.html` - メインHTMLファイル
- `dist/assets/` - CSS・JSファイル
- `dist/.htaccess` - SPAルーティング対応設定
- その他のアセットファイル

## 🚀 デプロイ

### アップロード先
```
[本番サーバーURL]/product/dist/
```

### アップロードするファイル
`dist/` フォルダの全内容をサーバーの `/product/dist/` ディレクトリにアップロードしてください。

### 必要なファイル
- ✅ `index.html`
- ✅ `assets/` フォルダ（CSS・JSファイル）
- ✅ `.htaccess` （SPAルーティング対応）
- ✅ その他のアセットファイル（画像など）

## ⚠️ 重要な注意事項

### APIサーバーについて
現在のアプリケーションは以下のAPIエンドポイントを使用しています：
```
[本番サーバーURL]:3001/api
```

静的ホスティングのみの場合、以下の機能は動作しません：
- ユーザー管理
- データの保存・読み込み
- お知らせ機能

### 完全に動作させるには
1. **APIサーバーの設置**: `server.cjs` を別途サーバーで動作させる
2. **CORS設定**: APIサーバーで適切なCORS設定を行う
3. **データベース**: ファイルベースのデータ管理を継続するか、データベースに移行

## 🔧 トラブルシューティング

### 白い画面が表示される場合
1. ブラウザの開発者ツールでコンソールエラーを確認
2. ネットワークタブでファイルの読み込み状況を確認
3. `.htaccess` ファイルが正しくアップロードされているか確認

### ルーティングが動作しない場合
1. `.htaccess` ファイルがアップロードされているか確認
2. サーバーでmod_rewriteが有効になっているか確認
3. RewriteBaseの設定が正しいか確認

### APIエラーが発生する場合
1. APIサーバーが動作しているか確認
2. CORS設定が正しいか確認
3. APIエンドポイントのURLが正しいか確認

## 📱 アクセスURL
デプロイ後は以下のURLでアクセスできます：
```
[本番サーバーURL]/product/dist/
``` 