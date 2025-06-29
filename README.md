# 📊 WatchMe v8 - 心理分析ダッシュボードシステム

[![React](https://img.shields.io/badge/React-19.1.0-blue)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.3.5-green)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-4.21.2-yellow)](https://expressjs.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.1.7-cyan)](https://tailwindcss.com/)

## 🎯 プロジェクト概要

WatchMe v8は、ユーザーの心理状態と行動ログをリアルタイムで可視化・分析するモバイルファースト設計のダッシュボードシステムです。AI分析結果を美しいグラフとインサイトで表示し、管理者による通知管理機能も備えています。

### ✨ 主要機能
- 📈 **心理グラフ**: 心理スコアの時系列グラフ表示（-100〜+100、30分間隔48ポイント）
- 📅 **行動グラフ**: 日々の活動パターン分析・可視化
- 🎭 **感情グラフ**: ⚠️ **【開発中】** Plutchik 8感情分類グラフ（現在ハードコードされたモックデータを表示）
- 👤 **プロフィール**: ユーザー情報と設定管理
- 📢 **通知システム**: リアルタイム通知・管理機能
- 👥 **マルチアカウント**: ユーザー切り替え対応
- 🔧 **管理画面**: 通知管理・ユーザー管理・データアップロード

## 🚀 クイックスタート

### 📋 必要環境
- Node.js 18+ 
- npm 8+
- モダンブラウザ（Chrome 90+, Firefox 90+, Safari 14+）

### ⚡ 起動方法

#### **自動起動（推奨）**
```bash
# 開発環境（フロントエンド + バックエンド同時起動）
./start-dev.sh

# 本番環境
./start-prod.sh
```

#### **手動起動**
```bash
# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev          # フロントエンド（ポート5173）
npm run server       # バックエンド（ポート3001）
```

### 🌐 アクセス
- **ダッシュボード**: http://localhost:5173
- **管理画面**: http://localhost:5173/admin
- **API**: http://localhost:3001/api

## 📱 機能概要

### ダッシュボード
- 感情タイムライン（30分間隔48ポイント）
- EC2 API（https://api.hey-watch.me）からのデータ取得
- **フロントエンド側でのデータ前処理**（NaN/null/float値対応）
- インタラクティブなツールチップ
- モバイル最適化UI

**データ前処理の詳細**:
- **NaN文字列**: "NaN"文字列を0に変換
- **無効値**: 数値変換できない値を0に変換  
- **float値**: 小数点値を四捨五入して整数化
- **範囲外値**: -100〜+100の範囲外値をクランプ
- **null/undefined**: データ欠損として保持（グラフで途切れ表示）
- **配列長不一致**: 短い方に合わせて調整
- **統計再計算**: 異常なaverageScoreを有効データから再計算

### 管理画面
- 通知管理システム
- ユーザー詳細表示
- データアップロード機能
- EC2からの一括データ更新機能

## 🏗️ アーキテクチャ

```
watchme_v8/
├── 📁 src/                    # React フロントエンド
│   ├── 📁 components/         # UI コンポーネント
│   ├── 📁 pages/             # ページコンポーネント
│   ├── 📁 services/          # API サービス
│   └── 📁 utils/             # ユーティリティ
├── 📁 data_accounts/         # ローカルデータストレージ
│   └── 📁 {user_id}/         # ユーザー別データ
│       └── 📁 logs/          # 日付別ログファイル
├── 📁 public/                # 静的ファイル
│   └── 📁 avatars/           # プロフィール画像
├── 🗃️ server.cjs             # Express.js バックエンド
├── 📜 package.json           # 依存関係
└── 📜 README.md              # プロジェクト説明
```

**データフロー**:
1. **EC2 API** → `https://api.hey-watch.me/api/users/{userId}/logs/{date}/emotion-timeline`
2. **ローカルキャッシュ** → `data_accounts/{userId}/logs/{date}.json`
3. **フロントエンド表示** → React コンポーネント

### 🔧 技術スタック
- **フロントエンド**: React 19.1.0, Vite 6.3.5, Tailwind CSS 4.1.10, Chart.js 4.4.9
- **バックエンド**: Express.js 4.21.2, Node.js
- **データ**: EC2サーバー（WatchMe Vault API）上のファイルベースJSON（/home/ubuntu/data/data_accounts/）
- **データ形式**: 30分間隔48ポイント（1日24時間）
- **データ前処理**: フロントエンド側でNaN/null/float値の自動補正
- **UI/UX**: モバイルファースト, レスポンシブデザイン
- **デプロイ**: 静的ファイル + Node.js サーバー

---

## ⚠️【重要】開発者向けガイドライン

### 🚨【緊急】感情グラフ（EmotionGraph）の開発状況

**⚠️ 重要な注意事項**: 感情グラフ（ダッシュボード3番目のタブ）は現在**開発中**です。

#### **UIでの正しい用語統一**
- 1番目タブ：**心理グラフ** (EmotionTimeline) - 心理スコア時系列 ✅ 実装済み
- 2番目タブ：**行動グラフ** (EventLogs) - 行動ログ分析 ✅ 実装済み  
- 3番目タブ：**感情グラフ** (EmotionGraph) - Plutchik 8感情分類 ❌ 開発中
- 4番目タブ：**プロフィール** (ProfileView) - ユーザー情報 ✅ 実装済み

#### **現在の状況**
- **実装場所**: `src/components/dashboard/EmotionGraph.jsx`
- **データ**: ハードコードされたモックデータ（MOCK_EMOTION_DATA）のみ表示
- **API連携**: 未実装（実際のJSONファイルからデータを読み取っていない）
- **動作**: 毎回同じサンプルデータを表示

#### **実装されていない機能**
- 実際のユーザーデータの表示
- 日付変更時のデータ更新
- ユーザー切り替え時のデータ変更
- APIからのデータ取得

#### **次回開発時の作業内容**
1. `EmotionGraph.jsx`でAPIからデータを取得する実装
2. 既存の`emotion-timeline`データを`emotion_graph`形式に変換
3. モックデータ削除
4. Dashboard.jsxからの適切なプロパティ渡し

**この状況は危険です。開発チームは必ずこの状況を認識した上で作業を進めてください。**

## ⚠️【重要】開発者向けガイドライン

### 🌐 CORSエラーとプロキシによる解決策

開発中にフロントエンド（例: `http://localhost:5173`）から直接Vault API（`https://api.hey-watch.me`）へ`fetch`リクエストを行うと、ブラウザのセキュリティポリシーにより**CORSエラー**が発生します。

これを回避するため、本プロジェクトではバックエンドサーバー（`server.cjs`）を**プロキシ**として利用します。フロントエンドからのAPIリクエストは、必ずこのプロキシを経由させてください。

**正しいデータフロー:**
`フロントエンド` → `プロキシ (server.cjs)` → `Vault API`

#### プロキシエンドポイント

`server.cjs`に以下のプロキシエンドポイントが実装されています。フロントエンドからはこちらを呼び出してください。

-   **感情タイムライン**:
    -   `GET /api/proxy/emotion-timeline/:userId/:date`
    -   転送先: `https://api.hey-watch.me/api/users/:userId/logs/:date/emotion-timeline`

-   **行動グラフ (SEDサマリー)**:
    -   `GET /api/proxy/sed-summary/:userId/:date`
    -   転送先: `https://api.hey-watch.me/api/users/:userId/logs/:date/sed-summary`

#### 謎：なぜ以前は心理グラフが動いたのか？

過去のバージョンでは、ダッシュボードの初期表示データは`data_accounts`ディレクトリにキャッシュされたJSONファイルを読み込んでいました。これはフロントエンドが自身のサーバー（`localhost:3001`）と通信するだけだったため、CORSエラーが発生しませんでした。

CORSエラーは、**キャッシュされていない新しいデータ**を**フロントエンドから直接Vault APIに**取得しようとした際に初めて表面化しました。この動作は混乱を招くため、**「データ取得は必ずプロキシを介する」**というルールに統一しています。

**現在の状況（2025年1月更新）:**
- **行動グラフ（SEDサマリー）**: プロキシ経由でデータ取得 ✅
- **心理グラフ（感情タイムライン）**: プロキシ経由でデータ取得 ✅
- **感情分布**: プロキシ経由でデータ取得 ✅

すべてのグラフコンポーネントが統一されたプロキシパターンを使用し、CORSエラーを回避しています。

### ✅ Vault API構造統一完了

**Vault APIの構造が統一されました！** 以下の詳細をご確認ください：

#### **統一後の実装状況**

**✅ 正式API形式（統一完了）**:
- **感情タイムライン**: `GET /api/users/{userId}/logs/{date}/emotion-timeline` 🆕
- **SEDサマリー**: `GET /api/users/{userId}/logs/{date}/sed-summary`

両方とも以下の特徴を持ちます：
- 専用のFastAPIエンドポイントで実装
- JSONレスポンス、適切なエラーハンドリング
- 一貫したWebダッシュボード向けAPI設計

#### **改善された構造**

```
✅ 統一API：全てのダッシュボードデータが正式API形式
/api/users/{userId}/logs/{date}/emotion-timeline  # 感情タイムライン（NEW!）
/api/users/{userId}/logs/{date}/sed-summary       # SEDサマリー

📁 別用途：ファイル管理・デバッグ用途  
/status                                           # HTMLファイル一覧
/download-file?file_path={path}                   # 個別ファイルダウンロード
/view-file?file_path={path}                       # JSONファイル内容表示
```

#### **統一により解決された問題**

1. **設計の一貫性確保** ✅
   - 感情タイムライン・SEDサマリー共に正式API実装

2. **保守性の向上** ✅
   - 両APIに統一されたバリデーション・エラーハンドリング
   - ファイル構造変更に対する堅牢性

3. **セキュリティ強化** ✅
   - StaticFiles流用の廃止
   - 適切なアクセス制御の実装

プロキシサーバーが統一されたAPIへの安全なアクセスを提供し、フロントエンドでは一貫したデータ取得パターンを実現しています。

---

### 📊 データ取得アーキテクチャ

本ダッシュボードの心理グラフ（1番目タブ）は以下のエンドポイントから取得されます：

- **エンドポイント**: `GET /api/users/{user_id}/logs/{date}/emotion-timeline`
- **対象ファイル**: `/home/ubuntu/data/data_accounts/{user_id}/{date}/emotion-timeline/emotion-timeline.json`
- **取得されたJSONは最大48スロット（30分ごと）の心理スコア（-100〜+100）を含みます**

**EC2 API設定**:
- **ベースURL**: `https://api.hey-watch.me`
- **エンドポイント**: `/api/users/{userId}/logs/{date}/emotion-timeline`
- **データなし時**: 適切な「データなし」メッセージを表示

## 📚 ドキュメント

### 📖 主要ドキュメント
- **[📊 システムドキュメント](docs/SYSTEM_DOCUMENTATION.md)** - 技術仕様・機能詳細
- **[📱 ユーザーマニュアル](docs/USER_MANUAL.md)** - 操作方法・使い方
- **[🚀 APIリファレンス](docs/API_REFERENCE.md)** - API仕様・エンドポイント
- **[🌐 デプロイガイド](DEPLOY.md)** - 本番環境構築

### 🎯 機能別ガイド
- [感情タイムライン](docs/USER_MANUAL.md#📊-感情タイムライン) - グラフの見方・操作方法
- [通知管理](docs/USER_MANUAL.md#📢-通知管理) - 管理画面での通知操作
- [データ前処理](docs/SYSTEM_DOCUMENTATION.md#🧩-パターンマッチ処理の実装) - AI生成データの柔軟処理

## 🎨 特徴・革新点

### 🛡️ 堅牢なデータ処理
- **AI生成データ対応**: ChatGPT等のAI出力を柔軟に受け入れ
- **自動データ補正**: NaN/null/float値の自動処理
- **エラー耐性**: 不正データでも安定動作
- **フォールバック機能**: 最小限データでの表示継続
- **包括的日付処理**: 15の日付ユーティリティ関数で統一された処理

### 📊 高度な可視化
- **Chart.js活用**: インタラクティブなグラフ
- **データ品質表示**: 測定状況の透明化
- **動的時間間隔**: データ量に応じた最適表示（標準30分間隔）
- **レスポンシブチャート**: モバイル対応グラフ
- **データ欠損処理**: null値での線の途切れ表示とツールチップ説明

### 🔔 リアルタイム通知
- **JSON ファイルベース**: シンプルなデータ管理
- **未読状況管理**: 既読/未読の状態管理
- **一斉配信機能**: 管理者による全体通知
- **優先度設定**: 重要度別の通知分類

## 🗂️ プロジェクト構成

```
watchme_v8/
├── 📁 src/                    # フロントエンドソース
│   ├── 📁 components/         # Reactコンポーネント
│   │   ├── 📁 dashboard/      # ダッシュボード専用
│   │   │   ├── EmotionTimeline.jsx
│   │   │   ├── EventLogs.jsx
│   │   │   ├── EmotionDistribution.jsx
│   │   │   └── ProfileView.jsx
│   │   ├── 📁 admin/          # 管理画面専用
│   │   │   ├── UserManagement.jsx
│   │   │   ├── NotificationManagement.jsx
│   │   │   └── DataUpload.jsx
│   │   └── 📁 common/         # 共通コンポーネント
│   │       ├── DateNavigation.jsx
│   │       ├── LoadingSpinner.jsx
│   │       └── EmptyState.jsx
│   ├── 📁 pages/              # ページコンポーネント
│   │   ├── Dashboard.jsx      # メインダッシュボード
│   │   ├── Admin.jsx          # 管理画面
│   │   ├── UserDetail.jsx     # ユーザー詳細
│   │   └── Notifications.jsx  # 通知表示
│   ├── 📁 services/           # API通信・データ処理
│   │   ├── dataService.js     # データ取得・更新
│   │   ├── notificationService.js # 通知管理
│   │   ├── fileStorageService.js  # ファイル操作
│   │   └── staticFileService.js   # 静的ファイル管理
│   ├── 📁 utils/              # 🆕 ユーティリティ
│   │   └── dateUtils.js       # 📅 日付操作（15関数）
│   └── 📁 layouts/            # レイアウトコンポーネント
│       ├── MobileLayout.jsx   # モバイル用レイアウト
│       └── PageLayout.jsx     # ページレイアウト
├── 📁 docs/                   # ドキュメント
├── 📁 data_accounts/          # ユーザーデータ（JSON）
├── 📁 public/                 # 静的ファイル
│   └── 📁 avatars/            # プロフィール画像
├── 🗃️ server.cjs              # Express.js バックエンド
├── 📜 package.json            # 依存関係
└── 📜 README.md               # プロジェクト説明
```

## 👥 デフォルトアカウント

システムには以下のテストアカウントが設定済みです：

- **佐藤由紀子** (`user123`) - マスターアカウント
- **佐藤あやか** (`user456`) - 通常アカウント  
- **佐藤みなと** (`user789`) - 通常アカウント

## 🔧 開発・カスタマイズ

### 🛠️ 開発環境セットアップ
```bash
# リポジトリクローン
git clone [repository-url]
cd watchme_v8

# 依存関係インストール
npm install

# 開発サーバー起動
./start-dev.sh
```

### 🎨 カスタマイズポイント
- **テーマカラー**: `tailwind.config.js`
- **データ形式**: `src/services/staticFileService.js`のモックデータ
- **API設定**: `server.cjs`のEC2_CONFIG

## 🚀 デプロイ

詳細なデプロイ手順は [DEPLOY.md](DEPLOY.md) を参照してください。

## 🐛 トラブルシューティング

### よくある問題

#### データが表示されない
- データがない状態は正常です（30分〜1時間程度のJSONファイルブロック）
- 404エラーは「データなし」を示す正常なレスポンス
- EC2 API（https://api.hey-watch.me）からデータを取得し、データなし時は適切なメッセージを表示

#### EC2 API接続エラー
```bash
# EC2 APIの疎通確認
# SEDサマリー（正式API）
curl -I https://api.hey-watch.me/api/users/user123/logs/2025-01-15/sed-summary

# 感情タイムライン（正式API - 統一完了）
curl -I https://api.hey-watch.me/api/users/user123/logs/2025-01-15/emotion-timeline

# タイムアウト設定の確認（server.cjsのEC2_CONFIG）
```

#### サーバーが起動しない
```bash
# ポート3001が使用中の場合
lsof -ti:3001 | xargs kill -9

# 依存関係の問題
rm -rf node_modules package-lock.json
npm install
```

#### フロントエンドが表示されない
```bash
# ポート5173が使用中の場合
lsof -ti:5173 | xargs kill -9

# キャッシュクリア
npm run dev -- --force
```

### 📄 詳細デバッグ

#### 開発者向けコマンド
```bash
# ログファイルの確認
tail -f server.log

# データベース（JSON）の確認
cat data_accounts/users.json | jq .

# ビルド詳細出力
npm run build --verbose

# ESLint詳細チェック
npm run lint -- --debug
```

詳細は **[ユーザーマニュアル](docs/USER_MANUAL.md#🆘-トラブル時の対処法)** を参照

## 📈 今後の改善予定

### 🔒 セキュリティ強化
- [ ] JWT認証システム
- [ ] APIレート制限
- [ ] HTTPS対応
- [ ] ログ監査機能

### 🚀 機能拡張
- [ ] データエクスポート機能
- [ ] 週次・月次レポート
- [ ] プッシュ通知対応
- [ ] オフライン対応（PWA）

### ⚡ パフォーマンス
- [ ] React.memo 最適化
- [ ] 仮想化対応
- [ ] CDN 配信
- [ ] データキャッシュ

### 🧹 コード品質
- [x] 不要なデバッグページの削除
- [x] 日付ユーティリティの統一
- [x] 重複ファイルの整理
- [ ] TypeScript移行
- [ ] 単体テスト追加

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

---

**WatchMe v8** - 心理分析ダッシュボードシステム

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

---

**WatchMe v8** - 心理分析ダッシュボードシステム

### ✅ 修正完了事項

- **README更新**: EC2 API（https://api.hey-watch.me）からのデータ取得フローを正確に記述
- **不要ファイル削除**: サンプルファイル、重複設定ファイル、モックデータサービスを削除
- **コード修正**: 30分間隔48ポイントの正確な仕様に統一
- **アーキテクチャ整理**: 実際のデータ取得フローに基づいた構成に修正
