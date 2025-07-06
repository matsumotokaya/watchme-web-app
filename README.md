# 📊 WatchMe v8 - 心理分析ダッシュボードシステム

[![React](https://img.shields.io/badge/React-18.3.1-blue)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.3.5-green)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-4.21.2-yellow)](https://expressjs.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.1.7-cyan)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth-green)](https://supabase.com/)

## 🎯 プロジェクト概要

WatchMe v8は、**Supabase認証システム**を統合した心理状態と行動ログを可視化・分析するライフログツールです。デバイスベースのデータ収集により、ユーザーアカウントと測定デバイスを柔軟に関連付けて、モバイルファースト設計のダッシュボードで日々の活動を客観的に表示します。

### ✨ 主要機能
- 🔐 **Supabase認証**: メール/パスワードによる安全なログイン機能
- 📱 **デバイスベース管理**: ユーザーアカウントに複数のデバイス（device_id）を関連付け
- 💭 **心理グラフ（VibeGraph）**: 心理スコアの時系列グラフ表示（-100〜+100、30分間隔48ポイント）
- 🎵 **行動グラフ（BehaviorGraph）**: 音響イベント分析・SED（Sound Event Detection）による行動パターン可視化
- 🎭 **感情グラフ（EmotionGraph）**: ✅ **【実装完了】** Plutchik 8感情分類グラフ（OpenSMILE音声特徴量による感情分析）
- 👤 **プロフィール**: ユーザー情報と設定管理
- 📢 **通知システム**: リアルタイム通知・管理機能
- 🔧 **管理画面**: 通知管理・ユーザー管理・データアップロード

## 🚀 クイックスタート

### 📋 必要環境
- Node.js 18+ 
- npm 8+
- **Supabaseプロジェクト**（認証設定済み）
- モダンブラウザ（Chrome 90+, Firefox 90+, Safari 14+）

### 🔧 環境設定

#### **1. Supabase設定**
`.env`ファイルを作成してSupabase認証情報を設定：

```env
# Supabase 設定
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# 開発用設定
NODE_ENV=development
```

#### **2. 依存関係インストール**
```bash
# React 18対応のため legacy-peer-deps フラグを使用
npm install --legacy-peer-deps
```

#### **🚨 重要: React 18 互換性対応**
このプロジェクトは **React 18.3.1** を使用しています。React 19との互換性問題により、以下の対応を実施済み：

- `react-swipeable-views@0.14.0` の互換性確保
- Vite 6.3.5 との安定した動作環境
- 依存関係の競合解決（`--legacy-peer-deps` 使用）

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
# 開発サーバー起動
npm run dev          # フロントエンド（ポート5173）
npm run server       # バックエンド（ポート3001）
```

### 🌐 アクセス
- **ダッシュボード**: http://localhost:5173 （認証が必要）
- **管理画面**: http://localhost:5173/admin
- **API**: http://localhost:3001/api

## 📱 機能概要

### ダッシュボード
- 心理グラフ（30分間隔48ポイント）
- EC2 Vault API（https://api.hey-watch.me）からのデータ取得
- **フロントエンド側でのデータ前処理**（NaN/null/float値対応）
- データ欠損時は測定なし期間として客観的表示
- インタラクティブなツールチップ
- モバイル最適化UI

**データ前処理の詳細**:
- **NaN文字列**: "NaN"文字列を0に変換
- **無効値**: 数値変換できない値を0に変換  
- **float値**: 小数点値を四捨五入して整数化
- **範囲外値**: -100〜+100の範囲外値をクランプ
- **null/undefined**: 測定なし期間として保持（グラフで途切れ表示）
- **配列長不一致**: 短い方に合わせて調整
- **統計再計算**: 異常なaverageScoreを有効データから再計算

### 管理画面
- 通知管理システム
- ユーザー詳細表示
- データアップロード機能
- EC2 Vault APIからの一括データ更新機能

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
1. **EC2 Vault API** → `https://api.hey-watch.me/api/users/{userId}/logs/{date}/emotion-timeline`
2. **ローカルキャッシュ** → `data_accounts/{userId}/logs/{date}.json`
3. **フロントエンド表示** → React コンポーネント

### 🔧 技術スタック
- **フロントエンド**: React 18.3.1, Vite 6.3.5, Tailwind CSS 4.1.10, Chart.js 4.4.9
- **バックエンド**: Express.js 4.21.2, Node.js
- **データソース**: EC2 Vault API（WatchMe Vault API）上のファイルベースJSON（/home/ubuntu/data/data_accounts/）
- **データ形式**: 30分間隔48ポイント（1日24時間）
- **データ前処理**: フロントエンド側でNaN/null/float値の自動補正
- **UI/UX**: モバイルファースト, レスポンシブデザイン, ライフログツール
- **デプロイ**: 静的ファイル + Node.js サーバー

---

## ⚠️【重要】開発者向けガイドライン

### ✅【完了】感情グラフ（EmotionGraph）の実装状況

**🎉 実装完了**: 感情グラフ（ダッシュボード3番目のタブ）が**実装完了**しました。

#### **UIでの正しい用語統一（2025年6月更新）**
- 1番目タブ：**心理グラフ** - 心理スコア時系列 ✅ 実装済み
- 2番目タブ：**行動グラフ** - 行動ログ分析 ✅ 実装済み  
- 3番目タブ：**感情グラフ** - Plutchik 8感情分類 ✅ 実装済み
- 4番目タブ：**プロフィール** - ユーザー情報 ✅ 実装済み

#### **内部コンポーネント名とファイル対応（重要）**
混乱を避けるため、内部的なコンポーネント名を以下に統一しました：

| UI表示名 | 内部コンポーネント名 | ファイルパス | APIエンドポイント |
|---------|------------------|-------------|------------------|
| **心理グラフ** | `VibeGraph` | `src/components/dashboard/EmotionTimeline.jsx` | `/api/users/{userId}/logs/{date}/emotion-timeline` |
| **行動グラフ** | `BehaviorGraph` | `src/components/dashboard/EventLogs.jsx` | `/api/users/{userId}/logs/{date}/sed-summary` |
| **感情グラフ** | `EmotionGraph` | `src/components/dashboard/EmotionGraph.jsx` | `/api/users/{userId}/logs/{date}/opensmile-summary` |
| **デバイス管理** | `DeviceView` | `src/components/dashboard/DeviceView.jsx` | Supabase `devices` テーブル |

⚠️ **注意**: ファイルパスとAPIエンドポイントは歴史的経緯により異なる命名となっています。今後の開発時は上記対応表を参照してください。

#### **実装完了内容（2025年6月30日）**
- **実装場所**: `src/components/dashboard/EmotionGraph.jsx`
- **データソース**: Vault API `/api/users/{userId}/logs/{date}/opensmile-summary` からリアルタイム取得
- **API連携**: ✅ 完全実装（useVaultAPIフック使用）
- **動作**: OpenSMILE音声特徴量解析による実際の感情データを表示

#### **実装済み機能**
- ✅ 実際のユーザーデータの表示（OpenSMILE音声特徴量ベース）
- ✅ 日付変更時のデータ自動更新
- ✅ ユーザー切り替え時のデータ自動変更  
- ✅ Vault APIからのリアルタイムデータ取得
- ✅ Plutchik 8感情分類グラフ（怒り、恐れ、期待、驚き、喜び、悲しみ、信頼、嫌悪）
- ✅ 感情フィルター機能（表示/非表示切り替え）
- ✅ データサマリー統計（合計・最大値）
- ✅ エラーハンドリング・NaN値自動正規化

#### **技術仕様**
- **データ形式**: 30分間隔48ポイント（1日24時間）
- **プロキシ経由**: `server.cjs`の`/api/proxy/opensmile-summary`エンドポイント
- **グラフライブラリ**: Chart.js（Line Chart）
- **エラー処理**: 他グラフと統一されたNoDataMessage表示

**🎉 3つのグラフ機能がすべて完成し、統一されたダッシュボードが実現されました！**

## ⚠️【重要】開発者向けガイドライン

### 🌐 CORSエラーとプロキシによる解決策

開発中にフロントエンド（例: `http://localhost:5173`）から直接EC2 Vault API（`https://api.hey-watch.me`）へ`fetch`リクエストを行うと、ブラウザのセキュリティポリシーにより**CORSエラー**が発生します。

これを回避するため、本プロジェクトではバックエンドサーバー（`server.cjs`）を**プロキシ**として利用します。フロントエンドからのAPIリクエストは、必ずこのプロキシを経由させてください。

**正しいデータフロー:**
`フロントエンド` → `プロキシ (server.cjs)` → `EC2 Vault API`

#### プロキシエンドポイント

`server.cjs`に以下のプロキシエンドポイントが実装されています。フロントエンドからはこちらを呼び出してください。

-   **心理グラフ (感情タイムライン)**:
    -   `GET /api/proxy/emotion-timeline/:userId/:date`
    -   転送先: `https://api.hey-watch.me/api/users/:userId/logs/:date/emotion-timeline`

-   **行動グラフ (SEDサマリー)**:
    -   `GET /api/proxy/sed-summary/:userId/:date`
    -   転送先: `https://api.hey-watch.me/api/users/:userId/logs/:date/sed-summary`

-   **感情グラフ (OpenSMILEサマリー)**:
    -   `GET /api/proxy/opensmile-summary/:userId/:date`
    -   転送先: `https://api.hey-watch.me/api/users/:userId/logs/:date/opensmile-summary`

#### 謎：なぜ以前は心理グラフが動いたのか？

過去のバージョンでは、ダッシュボードの初期表示データは`data_accounts`ディレクトリにキャッシュされたJSONファイルを読み込んでいました。これはフロントエンドが自身のサーバー（`localhost:3001`）と通信するだけだったため、CORSエラーが発生しませんでした。

CORSエラーは、**キャッシュされていない新しいデータ**を**フロントエンドから直接EC2 Vault APIに**取得しようとした際に初めて表面化しました。この動作は混乱を招くため、**「データ取得は必ずプロキシを介する」**というルールに統一しています。

**現在の状況（2025年6月30日更新）:**
- **心理グラフ（感情タイムライン）**: プロキシ経由でデータ取得 ✅
- **行動グラフ（SEDサマリー）**: プロキシ経由でデータ取得 ✅
- **感情グラフ（OpenSMILEサマリー）**: プロキシ経由でデータ取得 ✅

3つのグラフコンポーネントがすべて統一されたプロキシパターンを使用し、CORSエラーを回避しています。

### ✅ Vault API構造統一完了

**Vault APIの構造が統一されました！** 以下の詳細をご確認ください：

#### **統一後の実装状況**

**✅ 正式API形式（統一完了）**:
- **心理グラフ（感情タイムライン）**: `GET /api/users/{userId}/logs/{date}/emotion-timeline`
- **行動グラフ（SEDサマリー）**: `GET /api/users/{userId}/logs/{date}/sed-summary`
- **感情グラフ（OpenSMILEサマリー）**: `GET /api/users/{userId}/logs/{date}/opensmile-summary` 🆕

3つすべて以下の特徴を持ちます：
- 専用のFastAPIエンドポイントで実装
- JSONレスポンス、適切なエラーハンドリング
- 一貫したWebダッシュボード向けAPI設計

#### **改善された構造**

```
✅ 統一API：全てのダッシュボードデータが正式API形式
/api/users/{userId}/logs/{date}/emotion-timeline    # 心理グラフ（感情タイムライン）
/api/users/{userId}/logs/{date}/sed-summary         # 行動グラフ（SEDサマリー）
/api/users/{userId}/logs/{date}/opensmile-summary   # 感情グラフ（OpenSMILEサマリー）🆕

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

**EC2 Vault API設定**:
- **ベースURL**: `https://api.hey-watch.me`
- **エンドポイント**: `/api/users/{userId}/logs/{date}/emotion-timeline`
- **データなし時**: 測定なし期間として客観的に表示

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

### 🛡️ 堅牢なデータ処理（2025年6月強化）
- **AI生成データ対応**: ChatGPT等のAI出力を柔軟に受け入れ
- **NaN値自動正規化**: 多層防御でNaN→null変換（EC2データ破損に対応）
- **自動データ補正**: NaN/null/float値の自動処理
- **エラー耐性**: 不正データでも安定動作
- **フォールバック機能**: 最小限データでの表示継続
- **包括的日付処理**: 15の日付ユーティリティ関数で統一された処理

#### **NaN値対応の多層防御システム**
システム全体でNaN値に対する堅牢な処理を実装：

1. **第1防御**: `useVaultAPI`フックでのデータ取得時正規化
   - 全データ構造を再帰的スキャン
   - `typeof obj === 'number' && isNaN(obj)` → `null`変換
   - 文字列`"NaN"`も`null`に変換

2. **第2防御**: 各グラフコンポーネントでの描画時正規化
   - `VibeGraph`: emotionScores配列の要素レベル検査
   - `BehaviorGraph`: 同様の防御機能
   - 変換時のログ出力でトレーサビリティ確保

3. **グラフ描画**: Chart.jsでのnull値適切処理
   - `spanGaps: false`でnull部分の線途切れ
   - ツールチップで「測定なし」表示
   - ポイント非表示化

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

### 🎯 ユーザーフレンドリーなエラー処理（2025年6月改善）
従来の技術的エラーメッセージから、分かりやすいユーザー向け表示に改善：

#### **改善前（問題あり）**
```
❌ HTTP 404: Not Found (目立つ赤色表示)
📊 [正常なグラフ表示] (混在して混乱)
```

#### **改善後（ユーザーフレンドリー）**
```
📄 測定データなし
   この日は計測機器が動作していませんでした
   
   エラーコード: 404  (小さく表示・CS用)
```

#### **実装詳細**
- **ErrorDisplayコンポーネント削除**: 目立つ赤色警告を非表示
- **NoDataMessageコンポーネント強化**: 
  - ユーザー向け分かりやすい説明
  - カスタマーサービス用の小さなエラーコード表示
- **条件分岐改善**: エラー時はグラフ非表示、適切な状態管理

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

## 🌐 本番環境構成（デプロイ手順・稼働情報）

### ✅ デプロイ先サーバー

- **Amazon EC2 インスタンス**（Ubuntu）
- **Elastic IP**: `3.24.16.82`
- **ドメイン割当済み**：
  - **https://dashboard.hey-watch.me**（Nginx + リバースプロキシ経由）
  - Nginxがリクエストを内部の `localhost:3001` に転送

---

### ✅ アプリ起動方式

- **Dockerは使用していません**（現時点では素のNode環境）
- アプリは `/home/ubuntu/watchme-web-app` にクローン済み
- `nvm` を使って **Node.js v22** 系を利用
- 本番アプリは **systemd** を使って**常駐プロセスとして管理**

---

### ✅ systemd 管理情報

- **ユニットファイルの場所**：
  ```bash
  /etc/systemd/system/watchme-web-app.service
  ```

- **実行コマンド（内部）**：
  ```bash
  ExecStart=/home/ubuntu/.nvm/versions/node/v22.17.0/bin/npm run start
  ```

- **自動起動設定済み**（サーバ再起動後も自動で復帰）

- **状態確認・操作コマンド一覧**：
  ```bash
  # ステータス確認
  sudo systemctl status watchme-web-app

  # 停止
  sudo systemctl stop watchme-web-app

  # 再起動
  sudo systemctl restart watchme-web-app

  # ログ監視
  sudo journalctl -u watchme-web-app -f
  ```

---

## 🐛 トラブルシューティング

### よくある問題

#### データが表示されない
- データがない状態は正常です（測定なし期間として表示）
- 404エラーは「測定なし」を示す正常なレスポンス
- EC2 Vault API（https://api.hey-watch.me）からデータを取得し、データなし時は客観的に表示

#### NaN値エラーの解決（2025年6月対応済み）
```bash
# 従来発生していた問題
{"detail":"Unexpected error: Out of range float values are not JSON compliant: nan"}

# 現在の対応状況
✅ useVaultAPIで自動正規化: NaN → null変換
✅ コンポーネントレベルで二重防御
✅ グラフ正常描画: null値は「測定なし」として表示
✅ ユーザーフレンドリー: エラーコードのみ小さく表示
```

#### EC2 Vault API接続エラー
```bash
# EC2 Vault APIの疎通確認
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
- [x] **コンポーネント名統一（2025年6月完了）**
- [x] **NaN値防御システム実装（2025年6月完了）**
- [x] **ユーザーフレンドリーエラー表示（2025年6月完了）**
- [ ] ファイルパス・APIエンドポイント命名統一
- [ ] TypeScript移行
- [ ] 単体テスト追加

### 🔄 命名統一計画（今後の課題）
現在、歴史的経緯により命名が不統一な部分の整理予定：

#### **現状（混乱要因）**
```
心理グラフ: VibeGraph → EmotionTimeline.jsx → emotion-timeline API
行動グラフ: BehaviorGraph → EventLogs.jsx → sed-summary API
```

#### **将来の理想形**
```
心理グラフ: VibeGraph → VibeGraph.jsx → vibe-graph API
行動グラフ: BehaviorGraph → BehaviorGraph.jsx → behavior-graph API
```

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

---

**WatchMe v8** - 心理分析ダッシュボードシステム

---

## 🔐 認証・セキュリティシステム

### ✅ Supabase認証統合完了

**【2025年7月6日更新】** Supabase Auth.userを使用した本格的な認証システムとデバイス管理機能が実装されました。

#### 現在のアカウント管理方式
- **ログイン機能**: ✅ **実装完了** - Supabase Auth（メール/パスワード）
- **ログアウト機能**: ✅ **実装完了** - セッション管理対応
- **認証状態管理**: ✅ **実装完了** - useAuthカスタムフック
- **ルート保護**: ✅ **実装完了** - ProtectedRouteコンポーネント

#### 新しいデータ構造
- **ユーザーアカウント**: Supabaseのauth.usersテーブルで管理
- **デバイス管理**: device_idベースでユーザーアカウントと関連付け
- **データ取得**: アカウント → 選択デバイス → グラフデータの流れ

#### 実装済み認証機能
- **メール/パスワード認証**: Supabase Authを使用
- **セッション管理**: 自動的な認証状態の同期
- **ルート保護**: 未認証時は自動的にログインページにリダイレクト
- **認証コンテキスト**: React Context APIによる認証状態の管理

#### セキュリティ強化
- ✅ **認証必須**: 全ページで認証が必要
- ✅ **セッション管理**: 自動ログイン状態維持
- ✅ **セキュアなAPIキー管理**: 環境変数での管理
- ✅ **デバイス選択機能**: 実装完了 - ユーザーが複数デバイスを管理可能

#### デバイス管理機能
- **デバイス一覧表示**: ユーザーに紐づくデバイスの表示
- **デバイス追加**: UUIDベースの新規デバイス登録
- **デバイス選択**: データ表示対象デバイスの切り替え
- **重複チェック**: 既存デバイスの重複追加防止
- **リアルタイム更新**: デバイス追加後の即座な一覧更新

### 🔧 実装技術詳細

#### 認証フロー
```javascript
// 1. 認証状態確認
const { user, loading } = useAuth();

// 2. 未認証時はログインフォーム表示
if (!user) return <LoginForm />;

// 3. 認証済みユーザーはダッシュボードアクセス可能
return <Dashboard />;
```

#### 主要ファイル構成
- `src/lib/supabase.js` - Supabaseクライアント設定
- `src/hooks/useAuth.jsx` - 認証状態管理フック
- `src/components/auth/LoginForm.jsx` - ログインUIコンポーネント
- `src/App.jsx` - 認証ガードとルート設定

### 🚀 今後の開発予定

#### 次回実装予定
- [ ] ユーザーに紐づくデバイス選択機能
- [ ] Supabaseデータベースとの完全統合
- [ ] デバイスベースのデータ取得システム
- [ ] ロールベースアクセス制御（RBAC）

#### 中長期改善
- [ ] 操作ログ・監査機能
- [ ] リアルタイム通知システム
- [ ] モバイルアプリとの連携強化
- [ ] 高度なデータ可視化機能

---

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
