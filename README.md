# 📊 WatchMe v8 - WatchMe(ウェブ版)

[![React](https://img.shields.io/badge/React-18.3.1-blue)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.3.5-green)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-4.21.2-yellow)](https://expressjs.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.1.7-cyan)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth-green)](https://supabase.com/)

## 🚀 クイックスタート（重要：最初にお読みください）

### 📋 必要環境
- Node.js 18+ 
- npm 8+
- **Supabaseプロジェクト**（認証設定済み）

### 🔧 環境設定

#### **1. 依存関係のインストール**
```bash
npm install --legacy-peer-deps
```

#### **2. 環境設定**
`.env`ファイルを作成して各種設定を行います：

```env
# Supabase 設定（必須）
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# 開発用設定
NODE_ENV=development

# データソース設定（supabase または vault）
VITE_DATA_SOURCE=supabase

# サーバー設定（オプション：デフォルト値あり）
PORT=3001
VITE_PORT=5173
EXPRESS_JSON_LIMIT=50mb
DATA_ROOT_DIR=data_accounts
USERS_FILE_NAME=users.json
STATIC_DIST_DIR=dist
AVATARS_DIR=public/avatars

# パス設定（環境別）
VITE_BASE_PATH=/product/dist/

# CORS設定（本番環境用、カンマ区切り）
# CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
```

**⚙️ 設定の一元管理について：**
- すべての設定は`.env`ファイルで管理されます
- サーバー起動時に設定の検証が行われます
- 開発環境では設定内容がコンソールに表示されます
- 必須設定が不足している場合はエラーメッセージが表示されます

**🔄 環境ごとの設定簡素化：**
- `vite.config.js`と`server.js`の設定重複を解消
- `NODE_ENV`に基づく動的な設定決定
- 環境別パス設定とCORS設定の自動切り替え
- 開発/本番環境での最適化設定

**🛡️ エラーハンドリング強化：**
- 統一エラーハンドリングシステム (`config/errorHandler.js`)
- HTTPステータスコード別の具体的エラーメッセージ
- ネットワーク・データベース・ファイルシステムエラーの分類
- 開発環境での詳細ログと本番環境での安全なメッセージ

**⚡ ダッシュボード パフォーマンス最適化：**
- カスタムフック (`useDashboardData`) によるロジック分離
- コンポーネント分割でUIレンダリング専念（500行→175行）
- React.memo化による不要な再レンダリング防止
- 関心の分離によるメンテナンス性向上

**🗂️ ファイルシステムAPI削除：**
- 古いローカルファイルAPIを完全削除（15個のエンドポイント）
- グラフシステム：Supabase完全移行済み
- 通知システム：従来ファイルシステム（今後移行予定）

### ⚡ 起動方法

#### **通常のターミナルでの起動（推奨）**
```bash
# 開発サーバーを起動
./start-dev.command

# サーバーを停止
./stop-dev.command
```

#### **Claude CodeやVS Code統合ターミナルでの起動**
```bash
# バックグラウンドモードで起動（タイムアウト回避）
./start-dev.command --background

# サーバーを停止
./stop-dev.command

# ログファイルも削除する場合
./stop-dev.command --clean-logs
```

### 🌐 アクセス
- **ダッシュボード**: http://localhost:5173 （認証が必要）
- **API**: http://localhost:3001/api

## ⚠️ よくあるトラブルと解決方法

### 1. **サーバーが起動しない / すぐに停止する**

**原因**: Claude CodeやIDE統合ターミナルのタイムアウト制限
- 通常の`npm run dev`は永続的に動作するため、5-10秒でタイムアウトエラーになります

**解決方法**:
```bash
# バックグラウンドモードを使用
./start-dev.command --background

# または、nohupで直接起動
nohup npm run server > server.log 2>&1 &
nohup npm run dev > vite.log 2>&1 &
```

### 2. **ポートが既に使用されているエラー**

**エラー例**: `Error: listen EADDRINUSE: address already in use :::3001`

**解決方法**:
```bash
# ポート3001を使用しているプロセスを確認
lsof -i :3001

# プロセスを終了
kill -9 <PID>

# または、全ての関連プロセスを停止
./stop-dev.command
```

### 3. **npm installでエラーが発生**

**エラー例**: `npm ERR! peer dep missing`

**解決方法**:
```bash
# レガシーピア依存関係を許可してインストール
npm install --legacy-peer-deps

# それでも失敗する場合は、キャッシュをクリア
rm -rf node_modules package-lock.json
npm cache clean --force
npm install --legacy-peer-deps
```

### 4. **"command not found" エラー**

**解決方法**:
```bash
# 実行権限を付与
chmod +x start-dev.command
chmod +x stop-dev.command
```

### 5. **ログの確認方法**

サーバーが起動しているように見えてもアクセスできない場合：
```bash
# ログファイルを確認
tail -f server.log    # バックエンドのログ
tail -f vite.log      # フロントエンドのログ

# リアルタイムでプロセスを確認
ps aux | grep -E "(npm|node|vite)"
```

## 🆕 最新アップデート (2025-08-29)

### **watchme-networkインフラ管理体制への移行** 🔄
- ✅ **Docker Compose設定更新**: `docker-compose.yml`と`docker-compose.prod.yml`を`external: true`設定に変更
- ✅ **起動スクリプト改善**: `run-prod.sh`にwatchme-network存在確認を追加
- ✅ **systemd依存関係追加**: `watchme-docker.service`に`watchme-infrastructure.service`依存を設定
- ✅ **統一ネットワーク利用**: 全マイクロサービス間の安定した通信を実現

#### **実装内容**
1. **ネットワーク設定の変更**
   - `driver: bridge`から`external: true`へ移行
   - 既存のwatchme-networkを利用する設定に統一

2. **デプロイプロセスの改善**
   - インフラストラクチャ起動確認の自動化
   - ネットワーク接続状態の事前チェック
   - エラー時の分かりやすいメッセージ表示

## 🆕 最新アップデート (2025-07-11)

### **通知システム Supabase 統合完了** 🎉
- ✅ **Supabase通知テーブル統合**: PostgreSQL `notifications`テーブルによる堅牢な通知管理
- ✅ **リアルタイム未読バッジ**: ダッシュボード右上の通知アイコンに未読数表示
- ✅ **通知ページ実装**: タイトル・メッセージ・タイプ別アイコン表示機能
- ✅ **既読/未読機能**: 個別既読・一括既読機能による状態管理
- ✅ **通知タイプ対応**: announcement/event/systemタイプの分類表示

#### **実装内容**
1. **Supabaseテーブル設計**
   - `notifications`テーブル: id, user_id, type, title, message, is_read, created_at, triggered_by, metadata
   - UUID型user_idによるユーザー別通知管理
   - JSONB metadataフィールドによる拡張可能設計

2. **通知API関数実装** (`src/services/notificationService.js`)
   - `createNotification`: 通知作成
   - `getUserNotifications`: ユーザー通知取得（created_at降順）
   - `getUnreadNotificationCount`: 未読通知数取得
   - `updateNotificationReadStatus`: 個別既読状態更新
   - `markAllNotificationsAsRead`: 一括既読化
   - `deleteNotification`: 通知削除
   - `broadcastNotification`: 複数ユーザー一括送信

3. **UI統合**
   - **MobileLayout**: 通知アイコンのバッジ表示（未読数）
   - **Notifications.jsx**: 通知リスト表示ページ
   - **TypeScript型定義**: `src/types/notification.ts`
   - **認証ユーザー連携**: useAuthフックとの統合

4. **通知表示機能**
   - タイプ別アイコン表示（📢 announcement, 📅 event, ⚙️ system）
   - 相対時間表示（「3分前」「1時間前」など）
   - 既読/未読状態の視覚的区別
   - 個別既読ボタンと一括既読ボタン

### **観測対象システム統合・UI改善** 🎉
- ✅ **device_metadataテーブル統合**: 観測対象の情報（名前・年齢・性別・アバター）をデータベース管理
- ✅ **観測対象ページ改善**: セクション順序の最適化（観測対象情報→デバイス→観測者）
- ✅ **アバター管理統合**: デバイスアバターからobservation subject（観測対象）アバターに移行
- ✅ **ヘッダーUI改善**: デバイス選択から観測対象選択UIに変更（アバターと名前表示）
- ✅ **観測対象情報設定**: モーダルによる観測対象データ入力機能（名前・年齢・性別・備考・アバター）

#### **実装内容**
1. **device_metadataテーブル連携**
   - 観測対象の基本情報管理（名前・年齢・性別・備考・アバターURL）
   - デバイスと観測対象の1:1関係の明確化
   - アバター画像のBase64形式での保存

2. **観測対象ページの改善**
   - セクション順序の最適化：観測対象情報 → 観測対象デバイス → 観測者
   - 観測対象情報内でのアバター表示（上部中央配置）
   - 観測対象情報設定モーダルの統合

3. **ヘッダーナビゲーション改善**
   - 観測対象のアバターと名前をヘッダーに表示
   - プルダウンメニューで観測対象を選択するUI
   - デバイス情報は補助情報として表示

4. **アバター管理の統合**
   - DeviceViewからアバター変更ボタンを削除
   - 観測対象情報設定モーダル内でアバター変更を統合
   - React Portalを使用したモーダル表示の改善

### **起動スクリプトの改善** 🔧
- ✅ 通常モードとバックグラウンドモードの2つの起動方法を提供
- ✅ Claude CodeやVS Code統合ターミナルでのタイムアウト問題を解決
- ✅ より詳細なプロセス管理とエラーハンドリング
- ✅ ログファイルの自動生成（`server.log`、`vite.log`）

## 🆕 最新アップデート (2025-07-10)

### **アバター変更機能実装完了** 🎉
- ✅ 高度な画像アップロード・編集機能を実装（ドラッグ&ドロップ対応）
- ✅ 画像クロップ機能（正方形・ズーム・プレビュー付き）
- ✅ 自動画像圧縮機能（最大1MB、WebP形式対応）
- ✅ マイページでのアバター表示・変更機能
- ✅ **Supabase Storage連携による永続化対応** 🆕

#### **実装内容**
1. **AvatarUploaderコンポーネント** (`src/components/profile/AvatarUploader.jsx`)
   - react-dropzoneによるドラッグ&ドロップ画像選択
   - react-easy-cropによる画像クロップ（1:1アスペクト比固定）
   - browser-image-compressionによる自動圧縮（1MB以下、WebP変換）
   - ズーム・パン操作対応
   - 処理中ローディング表示

2. **画像処理パイプライン**
   - **Step 1**: ファイル選択（最大30MB対応）
   - **Step 2**: 自動圧縮（1MB以下、1920px以下にリサイズ）
   - **Step 3**: クロップ編集（512x512px正方形出力）
   - **Step 4**: WebP形式で保存（品質80%、アンチエイリアシング有効）

3. **ProfilePage統合** (`src/pages/ProfilePage.jsx`)
   - アバタークリックでアップローダーモーダル表示
   - ホバー時カメラアイコン表示（アバター未設定時のみ）
   - リアルタイムプレビュー更新

4. **Supabase Storage連携** 🆕
   - **保存先**: `avatars/{user_id}/avatar.webp`（自動的にユーザーIDディレクトリに保存）
   - **署名付きURL**: 1時間有効な署名付きURLを自動生成・更新
   - **useAvatarフック**: (`src/hooks/useAvatar.js`) Storage操作を抽象化
   - **永続化**: リロード後もアバター画像が保持される
   - **ヘッダー表示**: ナビゲーションバーのプロフィールアイコンにもアバター表示

### **デバイスアバター機能実装完了** 🎉
- ✅ デバイスごとのアバター設定・表示機能
- ✅ 観測対象画面のUI改善（デバイス → 観測対象に変更）
- ✅ 観測者・観測対象の関係性を明確化

#### **実装内容**
1. **useDeviceAvatarフック** (`src/hooks/useDeviceAvatar.js`)
   - デバイス専用のSupabase Storage連携
   - `avatars/devices/{device_id}/avatar.webp`パスでの管理

2. **DeviceAvatarコンポーネント** (`src/components/dashboard/DeviceAvatar.jsx`)
   - 常時表示のカメラアイコン（右下に青い円形背景）
   - サイズ対応（small/medium/large）
   - クリック可能な直感的なUI

3. **観測対象画面の改善** (`src/components/dashboard/DeviceView.jsx`)
   - 「デバイス管理」→「観測対象」に名称変更
   - 大きなアバター表示（中央揃え）
   - ニックネーム表示機能（現在は「ニックネーム未設定」）
   - 観測者セクションの追加（ログインユーザー情報表示）
   - アカウントとデバイスの関係性を明確化

4. **メニューの改善**
   - 画面下メニュー：「デバイス」→「観測対象」
   - アイコン：スマホマーク → 人マークに変更

#### **技術仕様**
- **対応形式**: JPG, PNG, GIF, WebP（最大30MB）
- **出力形式**: WebP 512x512px（品質80%）
- **圧縮率**: 通常5-10MBの画像を1MB以下に圧縮
- **UI/UX**: PC・モバイル両対応、直感的な操作
- **パフォーマンス**: WebWorker使用による非同期処理

### **マイページ機能追加** 🎉
- ✅ ヘッダーナビゲーションにマイページアイコンを追加（通知アイコンの右側）
- ✅ ProfilePageコンポーネントを実装（ユーザー情報・デバイス管理・ログアウト機能）
- ✅ Supabase認証と連携したユーザープロフィール表示機能
- ✅ アバター変更機能の完全実装

#### **実装内容**
1. **ヘッダーナビゲーション拡張** (`src/layouts/MobileLayout.jsx`)
   - 通知アイコンの右側にマイページアイコンを配置
   - クリック時に`/profile`ページへ遷移

2. **ProfilePageコンポーネント** (`src/pages/ProfilePage.jsx`)
   - ユーザー名・メールアドレス表示（Supabase認証データ使用）
   - 紐付けデバイス一覧表示
   - ログアウト機能（Supabase認証と連携）
   - アバター変更機能（画像アップロード・編集）

3. **ルーティング設定** (`src/App.jsx`)
   - `/profile`ルートを追加
   - 認証が必要なページとして設定

### **感情グラフのSupabase統合完了** 🎉
- ✅ 感情グラフ（OpenSMILE）がSupabaseの`emotion_opensmile_summary`テーブルからデータを取得するように対応
- ✅ 3つのグラフ（心理・行動・感情）すべてがSupabaseデータベースに統合完了
- ✅ Vault API依存から完全に脱却し、より高速で安定したデータ取得を実現

#### **実装内容**
1. **Supabaseプロキシエンドポイント追加** (`server.cjs`)
   - `/api/proxy/opensmile-summary-supabase/:deviceId/:date` エンドポイントを追加
   - `emotion_opensmile_summary`テーブルからJSONBデータを取得
   - エラーハンドリング（404：データなし、500：サーバーエラー）

2. **useVaultAPIフック拡張** (`src/hooks/useVaultAPI.js`)
   - `opensmile-summary`エンドポイントのSupabase対応を追加
   - 環境変数`VITE_DATA_SOURCE=supabase`でSupabaseモードに切り替え

3. **データ形式互換性**
   - Supabaseの`emotion_graph`JSONB配列をそのまま利用
   - 既存のEmotionGraph.jsxコンポーネントと完全互換

## 🎯 プロジェクト概要

WatchMeは、音声メタ情報から「こころ」を可視化するツールです。心理グラフ、行動グラフ、感情グラフから構成され、認知特性やメンタルヘルスを定量的に計るために用いられます。**Supabase認証システム**を統合したデバイスベースのデータ収集により、ユーザーアカウントと測定デバイスを柔軟に関連付けて、モバイルファースト設計のダッシュボードで日々の活動を客観的に表示します。

## 🧭 システム設計思想

WatchMeの設計は、**デバイス中心アーキテクチャ**という独自の思想に基づいています：

### 1. **デバイスは自律的・独立した存在**
- 📱 **自律的動作**: 電源が入った瞬間からデータを記録・送信・分析しはじめる
- 🆔 **IDベース管理**: デバイス自体に主従関係はなく、UUID（device_id）ベースで記録を蓄積
- 🔄 **後付け接続**: 観測者（アカウント）との接続は後から行う設計

### 2. **アカウントはデバイスを「後から」登録する主体**
- 📲 **物理的認識**: QRコードなどで物理的に手元にあるデバイスを認識・紐づける
- 👁️ **可視化の開始**: 紐付けによりダッシュボードで可視化可能になる
- 👤 **観測対象の定義**: 「誰を観測しているか（subject情報）」は、アカウントが後付けで入力する

### 3. **device_metadataは説明的ラベル**
- 🏷️ **説明的情報**: device_metadataはあくまで説明的ラベルであり、デバイスに付随
- 📊 **データの実体**: 実際の測定データ（心理・行動・感情グラフ）は全てdevice_idに紐づく
- 🎭 **観測対象の人格化**: UIでは「デバイス」ではなく「観測対象（人物）」として表示

### 4. **分離された責任領域**
```
📱 デバイス層     → 自律的なデータ収集・蓄積
🗃️ データ層      → device_idベースのデータ管理
👤 アカウント層   → デバイス登録・観測対象設定
🎨 UI層         → 観測対象としての人間的表示
```

この設計により、デバイスの自律性を保ちながら、ユーザーには直感的な「人物観測」体験を提供しています。

### ✨ 主要機能

#### 🎯 **コア分析機能** - 全て実装完了
- 💭 **心理グラフ（VibeGraph）**: ✅ **完全実装** 心理スコアの時系列表示（-100〜+100、30分間隔48ポイント）
- 🎵 **行動グラフ（BehaviorGraph）**: ✅ **完全実装** 音響イベント分析（SED）による行動パターン可視化
- 🎭 **感情グラフ（EmotionGraph）**: ✅ **Supabase統合完了** Plutchik 8感情分類による感情分析グラフ（OpenSMILE音声特徴量）
- 📊 **統合ダッシュボード**: 3つのグラフを統合した包括的な心理・行動・感情分析

#### 🔐 **認証・ユーザー管理** - Supabase統合
- 🔑 **認証システム**: メール/パスワード認証、セッション管理、自動ルート保護
- 👤 **プロフィール管理**: ユーザー情報表示・設定管理、マイページ機能
- 📱 **デバイス管理**: 1ユーザー複数デバイス対応、UUID形式デバイス登録
- 🔄 **リアルタイム切り替え**: デバイス選択によるグラフデータ即座更新
- 🚪 **ログアウト機能**: Supabase認証と連携した統合ログアウト

#### 🎨 **ユーザーエクスペリエンス**
- 📱 **モバイルファースト設計**: レスポンシブUI、タッチ操作最適化
- 🌅 **日付ナビゲーション**: 直感的な日付選択・履歴閲覧
- ⚡ **高速データ取得**: Supabaseダイレクト接続による高速表示
- 🛡️ **堅牢なエラーハンドリング**: NaN値自動正規化、データ欠損時の適切な表示
- 🚀 **パフォーマンス最適化**: カスタムフック活用、コンポーネント分割、React.memo化

## 📱 機能概要

### ダッシュボード - パフォーマンス最適化アーキテクチャ
- **心理グラフ（30分間隔48ポイント）**: ✅ **Supabaseデータベース統合完了**
- **行動グラフ（SED分析）**: ✅ **Supabaseデータベース統合完了** - behavior_summaryテーブルから音響イベントデータを取得
- **感情グラフ（OpenSMILE分析）**: ✅ **Supabaseデータベース統合完了** - emotion_opensmile_summaryテーブルからPlutchik 8感情データを取得
- **フロントエンド側でのデータ前処理**（NaN/null/float値対応）
- データ欠損時は測定なし期間として客観的表示
- インタラクティブなツールチップ
- モバイル最適化UI

**🏗️ ダッシュボード技術仕様：**
- **`useDashboardData` フック**: データ取得・状態管理・イベントハンドリングを統合
- **`HeaderDeviceMenu` コンポーネント**: デバイス選択UI、React.memo最適化
- **`DashboardTabs` コンポーネント**: タブコンテンツ管理、ErrorBoundary統合
- **175行に簡素化**: 500行から65%削減、UIレンダリングに専念
- **関心の分離**: ロジック、UI、データ層の完全分離

**データ前処理の詳細**:
- **NaN文字列**: "NaN"文字列を0に変換
- **無効値**: 数値変換できない値を0に変換  
- **float値**: 小数点値を四捨五入して整数化
- **範囲外値**: -100〜+100の範囲外値をクランプ
- **null/undefined**: 測定なし期間として保持（グラフで途切れ表示）
- **配列長不一致**: 短い方に合わせて調整
- **統計再計算**: 異常なaverageScoreを有効データから再計算

## 🏗️ アーキテクチャ

```
watchme_v8/
├── 📁 src/                    # React フロントエンド
│   ├── 📁 components/         # UI コンポーネント
│   ├── 📁 pages/             # ページコンポーネント
│   ├── 📁 services/          # API サービス
│   └── 📁 utils/             # ユーティリティ
├── 📁 config/                # 設定管理
│   ├── 📄 environments.js    # 環境別設定の一元管理
│   └── 🛡️ errorHandler.js    # 統一エラーハンドリングシステム
├── 📁 hooks/                 # カスタムフック
│   ├── 🎯 useDashboardData.js # ダッシュボードロジック分離
│   ├── 🔐 useAuth.jsx        # 認証管理
│   └── 🗄️ useVaultAPI.js     # Supabaseデータ取得
├── 📁 data_accounts/         # ローカルデータストレージ
│   └── 📁 {device_id}/       # デバイス別データ
│       └── 📁 logs/          # 日付別ログファイル
├── 📁 public/                # 静的ファイル
│   └── 📁 avatars/           # プロフィール画像
├── 🗃️ server.cjs             # Express.js バックエンド（環境別設定対応）
├── ⚙️ vite.config.js         # Vite設定（環境変数ベース）
├── 📄 .env                   # 環境変数（設定一元管理）
├── 📜 package.json           # 依存関係
└── 📜 README.md              # プロジェクト説明
```

**データフロー（v8.3統合版）**:
1. **Supabaseデータベース** → `vibe_whisper_summary`（心理グラフ）、`behavior_summary`（行動グラフ）、`emotion_opensmile_summary`（感情グラフ）
2. **フロントエンド表示** → React コンポーネント

### 🔧 技術スタック
- **フロントエンド**: React 18.3.1, Vite 6.3.5, Tailwind CSS 4.1.10, Chart.js 4.4.9
- **バックエンド**: Express.js 4.21.2, Node.js
- **データベース**: ✅ **Supabase PostgreSQL** (vibe_whisper_summary, behavior_summary, emotion_opensmile_summary)
- **データ形式**: 30分間隔48ポイント（1日24時間）
- **データ前処理**: フロントエンド側でNaN/null/float値の自動補正
- **UI/UX**: モバイルファースト, レスポンシブデザイン, ライフログツール
- **デプロイ**: 静的ファイル + Node.js サーバー

## 🗄️ データベース統合状況

### ✅ Supabase統合完了

#### **心理グラフ（VibeGraph）**
- **テーブル**: `vibe_whisper_summary`
- **エンドポイント**: `/api/proxy/emotion-timeline-supabase/:deviceId/:date`
- **データ形式**: 30分間隔48ポイントの心理スコア（-100〜+100）

#### **行動グラフ（BehaviorGraph）**  
- **テーブル**: `behavior_summary`
- **エンドポイント**: `/api/proxy/sed-summary-supabase/:deviceId/:date`
- **データ形式**: 音響イベントランキング + 時間別イベント（48スロット）

**データ構造例**:
```json
{
  "summary_ranking": [
    {"event": "Speech", "count": 42},
    {"event": "Silence", "count": 38}
  ],
  "time_blocks": {
    "00-00": [{"event": "Speech", "count": 3}],
    "00-30": null
  }
}
```

#### **感情グラフ（EmotionGraph）**
- **テーブル**: `emotion_opensmile_summary`
- **エンドポイント**: `/api/proxy/opensmile-summary-supabase/:deviceId/:date`
- **データ形式**: Plutchik 8感情分類（30分間隔48ポイント）

---

## ⚠️【重要】開発者向けガイドライン

### ✅【完了】感情グラフ（EmotionGraph）の実装状況

**🎉 実装完了**: 感情グラフ（ダッシュボード3番目のタブ）が**実装完了**しました。

#### **UIでの正しい用語統一（2025年6月更新）**
- 1番目タブ：**心理グラフ** - 心理スコア時系列 ✅ 実装済み
- 2番目タブ：**行動グラフ** - 行動ログ分析 ✅ 実装済み  
- 3番目タブ：**感情グラフ** - Plutchik 8感情分類 ✅ 実装済み
- 4番目タブ：**デバイス** - デバイス情報 ✅ 実装済み

#### **内部コンポーネント名とファイル対応（重要）**
混乱を避けるため、内部的なコンポーネント名を以下に統一しました：

| UI表示名 | 内部コンポーネント名 | ファイルパス | データソース |
|---------|------------------|-------------|------------------|
| **心理グラフ** | `VibeGraph` | `src/components/dashboard/EmotionTimeline.jsx` | `/api/users/{deviceId}/logs/{date}/emotion-timeline` |
| **行動グラフ** | `BehaviorGraph` | `src/components/dashboard/EventLogs.jsx` | `/api/users/{deviceId}/logs/{date}/sed-summary` |
| **感情グラフ** | `EmotionGraph` | `src/components/dashboard/EmotionGraph.jsx` | `/api/proxy/opensmile-summary-supabase/:deviceId/:date` |
| **デバイス管理** | `DeviceView` | `src/components/dashboard/DeviceView.jsx` | Supabase `devices` テーブル |

⚠️ **重要**: 
- **グラフデータは全て`device_id`に紐づきます**
- ユーザーは複数のデバイスを管理でき、デバイス選択でグラフを切り替え可能
- APIエンドポイントパスの`{userId}`部分には実際は`device_id`が渡されます（歴史的経緯による命名）

#### **実装完了内容（2025年7月10日 - Supabase統合完了）**
- **実装場所**: `src/components/dashboard/EmotionGraph.jsx`
- **データソース**: ✅ `emotion_opensmile_summary`テーブル（Supabase統合完了）
- **API連携**: ✅ 完全実装（useVaultAPIフック使用、opensmile-summary対応済み）
- **動作**: OpenSMILE音声特徴量解析による実際の感情データを表示

#### **実装済み機能**
- ✅ 実際のデバイスデータの表示（OpenSMILE音声特徴量ベース）
- ✅ 日付変更時のデータ自動更新
- ✅ デバイス切り替え時のデータ自動変更  
- ✅ Vault APIからのリアルタイムデータ取得
- ✅ Plutchik 8感情分類グラフ（怒り、恐れ、期待、驚き、喜び、悲しみ、信頼、嫌悪）
- ✅ 感情フィルター機能（表示/非表示切り替え）
- ✅ データサマリー統計（合計・最大値）
- ✅ エラーハンドリング・NaN値自動正規化

#### **技術仕様**
- **データ形式**: 30分間隔48ポイント（1日24時間）
- **プロキシ経由**: `server.cjs`の`/api/proxy/opensmile-summary-supabase`エンドポイント
- **グラフライブラリ**: Chart.js（Line Chart）
- **エラー処理**: 他グラフと統一されたNoDataMessage表示

**🎉 3つのグラフ機能がすべて完成し、Supabase統合が完了した統一ダッシュボードが実現されました！**

## ⚠️【重要】開発者向けガイドライン

### 🌐 CORSエラーとプロキシによる解決策

開発中にフロントエンド（例: `http://localhost:5173`）から直接EC2 Vault API（`https://api.hey-watch.me`）へ`fetch`リクエストを行うと、ブラウザのセキュリティポリシーにより**CORSエラー**が発生します。

これを回避するため、本プロジェクトではバックエンドサーバー（`server.cjs`）を**プロキシ**として利用します。フロントエンドからのAPIリクエストは、必ずこのプロキシを経由させてください。

**正しいデータフロー:**
`フロントエンド` → `プロキシ (server.cjs)` → `EC2 Vault API`

#### プロキシエンドポイント

`server.cjs`に以下のプロキシエンドポイントが実装されています。フロントエンドからはこちらを呼び出してください。

##### ⚠️ 古いVault API エンドポイント（削除済み）
- **削除されたエンドポイント**: 
  - `/api/proxy/emotion-timeline/:deviceId/:date`（削除済み）
  - `/api/proxy/sed-summary/:deviceId/:date`（削除済み）
  - `/api/proxy/opensmile-summary/:deviceId/:date`（削除済み）
- **理由**: Supabaseデータベースへの完全移行により、古いEC2プロキシエンドポイントは不要となりました。

##### Supabase モード（推奨）
-   **心理グラフ (感情タイムライン)**:
    -   `GET /api/proxy/emotion-timeline-supabase/:deviceId/:date`
    -   データソース: `vibe_whisper_summary`テーブル

-   **行動グラフ (SEDサマリー)**:
    -   `GET /api/proxy/sed-summary-supabase/:deviceId/:date`
    -   データソース: `behavior_summary`テーブル

-   **感情グラフ (OpenSMILEサマリー)** 🆕:
    -   `GET /api/proxy/opensmile-summary-supabase/:deviceId/:date`
    -   データソース: `emotion_opensmile_summary`テーブル

#### 謎：なぜ以前は心理グラフが動いたのか？

過去のバージョンでは、ダッシュボードの初期表示データは`data_accounts`ディレクトリにキャッシュされたJSONファイルを読み込んでいました。これはフロントエンドが自身のサーバー（`localhost:3001`）と通信するだけだったため、CORSエラーが発生しませんでした。

CORSエラーは、**キャッシュされていない新しいデータ**を**フロントエンドから直接EC2 Vault APIに**取得しようとした際に初めて表面化しました。この動作は混乱を招くため、**「データ取得は必ずプロキシを介する」**というルールに統一しています。

**最新の状況（2025年7月11日更新）:**
- **心理グラフ（感情タイムライン）**: Supabase統合完了 ✅
- **行動グラフ（SEDサマリー）**: Supabase統合完了 ✅  
- **感情グラフ（OpenSMILEサマリー）**: Supabase統合完了 ✅
- **API エンドポイント**: 冗長なEC2プロキシエンドポイントを削除、Supabaseのみに統一 ✅
- **観測対象管理**: device_metadataテーブル統合によるアバター・情報管理システム完成 ✅
- **ヘッダーUI**: 観測対象中心の直感的デバイス選択インターフェース完成 ✅
- **設定一元管理**: .envファイルによる設定管理、検証機能、デフォルト値対応 ✅
- **環境別設定簡素化**: vite.config.jsとserver.cjsの設定重複解消、NODE_ENV基準の動的設定 ✅
- **エラーハンドリング強化**: 統一エラー処理、HTTPステータス別メッセージ、詳細ログ機能 ✅

3つのグラフコンポーネント、完全なデータベース統合、観測対象中心の設計アーキテクチャ、統一設定管理システム、および堅牢なエラーハンドリング機能を備えた高品質なウェブアプリケーションが実現されています。

### ✅ Supabaseデータベース統合完了

**3つのグラフすべてでSupabaseデータベース統合が完了しました！** 以下の詳細をご確認ください：

#### **統合完了状況**

**✅ Supabaseテーブル構成（統合完了）**:
- **心理グラフ（感情タイムライン）**: `vibe_whisper_summary`テーブル
- **行動グラフ（SEDサマリー）**: `behavior_summary`テーブル
- **感情グラフ（OpenSMILEサマリー）**: `emotion_opensmile_summary`テーブル 🆕

3つすべて以下の特徴を持ちます：
- PostgreSQL JSONBデータストレージ
- Supabaseプロキシエンドポイントでアクセス
- 高速なデータベース直接接続
- 統一されたエラーハンドリング

#### **データベース統合構造**

```
✅ Supabase統合：全てのダッシュボードデータがデータベース管理
/api/proxy/emotion-timeline-supabase/:deviceId/:date    # 心理グラフ
/api/proxy/sed-summary-supabase/:deviceId/:date         # 行動グラフ  
/api/proxy/opensmile-summary-supabase/:deviceId/:date   # 感情グラフ🆕

📊 データベーステーブル
- vibe_whisper_summary         # 心理スコア（30分間隔48ポイント）
- behavior_summary            # 音響イベントランキング・時系列
- emotion_opensmile_summary   # Plutchik 8感情分類データ
```

#### **Supabase統合により実現された改善**

1. **パフォーマンス向上** ✅
   - データベース直接接続による高速取得

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

- **エンドポイント**: `GET /api/users/{device_id}/logs/{date}/emotion-timeline`
- **対象ファイル**: `/home/ubuntu/data/data_accounts/{device_id}/{date}/emotion-timeline/emotion-timeline.json`
- **取得されたJSONは最大48スロット（30分ごと）の心理スコア（-100〜+100）を含みます**

**EC2 Vault API設定**:
- **ベースURL**: `https://api.hey-watch.me`
- **エンドポイント**: `/api/users/{deviceId}/logs/{date}/emotion-timeline`
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

### 🔔 通知システム
- **Supabaseデータベース統合**: PostgreSQL通知テーブルによる堅牢な管理
- **リアルタイム未読バッジ**: 通知アイコンでの未読数表示
- **未読状況管理**: 既読/未読の状態管理とバッチ処理
- **通知タイプ別表示**: announcement/event/systemタイプ別のアイコン表示
- **一斉配信機能**: 複数ユーザーへの一括通知送信

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

## Git 運用ルール（ブランチベース開発フロー）

このプロジェクトでは、**ブランチベースの開発フロー**を採用しています。  
main ブランチで直接開発せず、以下のルールに従って作業を進めてください。

---

### 🔹 運用ルール概要

1. `main` ブランチは常に安定した状態を保ちます（リリース可能な状態）。
2. 開発作業はすべて **`feature/xxx` ブランチ** で行ってください。
3. 作業が完了したら、GitHub上で Pull Request（PR）を作成し、差分を確認した上で `main` にマージしてください。
4. **1人開発の場合でも、必ずPRを経由して `main` にマージしてください**（レビューは不要、自分で確認＆マージOK）。

---

### 🔧 ブランチ運用の手順

#### 1. `main` を最新化して作業ブランチを作成
```bash
git checkout main
git pull origin main
git checkout -b feature/機能名


## ⚙️ Supabase Storage設定

アバター画像アップロード機能を使用するには、Supabase管理画面でRLSポリシーの設定が必要です。

### 設定手順
1. Supabase管理画面の「Storage」→「avatars」バケットを選択
2. 「Policies」タブで以下のポリシーを追加：
   - **SELECT/INSERT/UPDATE/DELETE**: `(auth.uid())::text = (storage.foldername(name))[1]`
   - これによりユーザーは自分のディレクトリ（`{user_id}/`）のみアクセス可能

詳細は[Supabase Storage設定ガイド](./docs/supabase-storage-setup.md)を参照してください。

## 🚀 デプロイ

### ⚠️ 重要：ネットワーク管理体制の変更（2025年8月）

**watchme-network** の管理が `watchme-server-configs` リポジトリの `docker-compose.infra.yml` に一元化されました。

#### 前提条件
1. **インフラストラクチャの起動**（EC2サーバー上で実行、初回のみ）
   ```bash
   cd /home/ubuntu/watchme-server-configs
   docker-compose -f docker-compose.infra.yml up -d
   ```

2. **ネットワーク接続の確認**
   ```bash
   # ネットワーク状態を確認
   bash /home/ubuntu/watchme-server-configs/scripts/check-infrastructure.sh
   
   # 問題がある場合は自動修復
   python3 /home/ubuntu/watchme-server-configs/scripts/network_monitor.py --fix
   ```

### 🐳 ECRを使用した本番環境デプロイ（推奨）

> **重要**: WatchMeプラットフォームは、ECRベースの統一されたデプロイ方式を使用します。
> 従来のgit pullベースのデプロイからECR/Dockerベースのデプロイに移行しました。

#### ⚠️ Viteプロジェクトのデプロイ注意事項

**重要**: Viteは**ビルド時**に環境変数を静的にバンドルします。そのため：
- ❌ **実行時の環境変数は反映されません**
- ✅ **Dockerビルド時に環境変数を渡す必要があります**

このプロジェクトでは、`deploy-ecr.sh`が自動的に`.env`ファイルから環境変数を読み込み、Dockerビルド時に渡すように設定されています。

#### 🎯 デプロイ方式の特徴

- ✅ **統一性**: 全APIで同じデプロイプロセス
- ✅ **バージョン管理**: タイムスタンプ付きイメージタグ
- ✅ **セキュリティ**: IAMロールベースの認証
- ✅ **スケーラビリティ**: EC2、ECS、EKSで共通利用可能
- ✅ **CI/CD対応**: GitHub Actionsとの統合容易
- ✅ **Vite対応**: ビルド時環境変数の自動注入

### 📋 本番環境デプロイ手順

#### **前提条件**
1. **ECRリポジトリ**: `754724220380.dkr.ecr.ap-southeast-2.amazonaws.com/watchme-web`
2. **EC2インスタンス**: Ubuntu 22.04 LTS (IP: 3.24.16.82)
3. **IAMロール**: EC2インスタンスに`EC2-ECR-Access-Role`がアタッチ済み
4. **Docker環境**: EC2にDocker & Docker Composeインストール済み

#### **Step 1: ローカルでのイメージビルドとプッシュ**
```bash
# 1. 環境変数の確認（重要！）
# .envファイルにVITE_で始まる環境変数が正しく設定されているか確認
cat .env | grep VITE_

# 2. ローカルで変更をコミット
git add .
git commit -m "変更内容"

# 3. ECRにDockerイメージをプッシュ
# このスクリプトが自動的に.envファイルから環境変数を読み込み、
# Dockerビルド時に渡します
./deploy-ecr.sh
```

**📝 deploy-ecr.shの動作**:
- `.env`ファイルから`VITE_`で始まる環境変数を自動読み込み
- `docker build --build-arg`で環境変数をビルド時に注入
- Viteがビルド時に環境変数を静的ファイルに埋め込み

#### **Step 2: 本番環境でのデプロイ**
```bash
# 1. EC2にSSH接続
ssh -i ~/watchme-key.pem ubuntu@3.24.16.82

# 2. デプロイディレクトリに移動
cd ~/watchme-docker

# 3. 最新イメージをプルして起動
./run-prod.sh
```

### 🔰 初回デプロイ時の設定

初回デプロイ時のみ、EC2インスタンスに必要なファイルを配置する必要があります：

```bash
# 1. ローカルからEC2に必要なファイルをコピー
scp -i ~/watchme-key.pem docker-compose.prod.yml ubuntu@3.24.16.82:~/watchme-docker/
scp -i ~/watchme-key.pem run-prod.sh ubuntu@3.24.16.82:~/watchme-docker/
scp -i ~/watchme-key.pem .env.example ubuntu@3.24.16.82:~/watchme-docker/

# 2. EC2にSSH接続
ssh -i ~/watchme-key.pem ubuntu@3.24.16.82

# 3. ディレクトリに移動
cd ~/watchme-docker

# 4. 環境変数を設定
cp .env.example .env
nano .env  # 実際の値を設定

# 5. run-prod.shに実行権限を付与
chmod +x run-prod.sh

# 6. 初回起動
./run-prod.sh
```

### 📁 本番環境のディレクトリ構成

```
/home/ubuntu/
├── watchme-docker/              # Docker関連ファイル
│   ├── docker-compose.prod.yml  # 本番用Docker Compose設定
│   ├── run-prod.sh             # 起動スクリプト
│   └── .env                    # 環境変数（実際の値）
└── watchme-web-app.backup.*/   # 旧Node.jsアプリ（バックアップ）
```

### 🛠️ systemdサービス管理

Dockerコンテナはsystemdサービスとして管理されています：

```bash
# サービスの状態確認
sudo systemctl status watchme-docker

# サービスの再起動
sudo systemctl restart watchme-docker

# サービスログの確認
sudo journalctl -u watchme-docker -f

# 自動起動の有効化（初回のみ）
sudo systemctl enable watchme-docker
```

### 📊 デプロイ後の確認

```bash
# 1. Dockerコンテナの状態確認
docker ps | grep watchme-web

# 2. コンテナログの確認
docker logs -f watchme-web-prod

# 3. ヘルスチェックエンドポイントの確認
curl http://localhost:3001/health

# 4. ブラウザでの動作確認
# https://dashboard.hey-watch.me
```

### ⚠️ 重要事項

- **ビルドは自動化**: Dockerfileのマルチステージビルドで自動実行
- **環境変数**: `.env`ファイルで管理（docker-compose.prod.ymlで読み込み）
- **ポート設定**: Dockerは内部3001ポート、Nginxが外部からのリクエストをプロキシ
- **データ永続化**: 必要に応じてDockerボリュームを設定

### 🔄 ロールバック手順

問題が発生した場合のロールバック：

```bash
# 1. 現在のイメージタグを確認
docker images | grep watchme-web

# 2. 前のバージョンのタグを指定して起動
docker-compose -f docker-compose.prod.yml stop
docker-compose -f docker-compose.prod.yml up -d --force-recreate \
  -e IMAGE_TAG=20250728-123456  # 前のタイムスタンプを指定
```

### 📝 デプロイチェックリスト

- [ ] ローカルでテスト完了
- [ ] **重要**: ローカルの`.env`ファイルに`VITE_`で始まる環境変数が設定されている
- [ ] `deploy-ecr.sh`が環境変数読み込み機能を持っている（2025年7月28日以降のバージョン）
- [ ] ECRへのイメージプッシュ成功
- [ ] 本番環境でのコンテナ起動確認
- [ ] ヘルスチェックエンドポイントの応答確認
- [ ] ブラウザでの動作確認（特にログイン画面でエラーが出ないこと）
- [ ] ブラウザの開発者コンソールで環境変数エラーが出ていないこと
- [ ] エラーログの確認

詳細なデプロイ手順は [DEPLOY.md](DEPLOY.md) を参照してください。

## 🌐 本番環境構成（ECRベースのDocker環境）

### ✅ デプロイ先サーバー

- **Amazon EC2 インスタンス**（Ubuntu 22.04 LTS）
- **Elastic IP**: `3.24.16.82`
- **ドメイン割当済み**：
  - **https://dashboard.hey-watch.me**（Nginx + リバースプロキシ経由）
  - Nginxがリクエストを内部の `localhost:3001` に転送

---

### ✅ アプリ起動方式（2025年7月28日 ECRに移行）

- **Dockerコンテナ**: ECRから最新イメージをプルして実行
- **ECRリポジトリ**: `754724220380.dkr.ecr.ap-southeast-2.amazonaws.com/watchme-web`
- **コンテナ名**: `watchme-web-prod`
- **本番アプリは systemd を使って Dockerコンテナを管理**

---

### ✅ systemd 管理情報

- **ユニットファイルの場所**：
  ```bash
  /etc/systemd/system/watchme-docker.service
  ```

- **実行コマンド（内部）**：
  ```bash
  ExecStart=/home/ubuntu/watchme-docker/run-prod.sh
  ```

- **自動起動設定済み**（サーバ再起動後も自動で復帰）

- **状態確認・操作コマンド一覧**：
  ```bash
  # systemdサービスの状態確認
  sudo systemctl status watchme-docker

  # Dockerコンテナの直接確認
  docker ps | grep watchme-web
  docker logs -f watchme-web-prod

  # サービス再起動（新しいイメージをプル）
  cd ~/watchme-docker && ./run-prod.sh

  # ログ監視
  sudo journalctl -u watchme-docker -f
  ```

---

### 📝 従来のNode.js環境からの移行について

2025年7月28日に、従来のNode.js直接実行環境からECR/Dockerベースの環境に移行しました：

- **旧環境**: `/home/ubuntu/watchme-web-app` (バックアップとして保存)
- **新環境**: `/home/ubuntu/watchme-docker` (Docker関連ファイル)
- **メリット**: 統一されたデプロイプロセス、バージョン管理、容易なロールバック

---

## 🐛 トラブルシューティング

### 🐳 ECRデプロイ関連の問題

#### ⚠️ Vite環境変数が本番で反映されない（最重要）
```bash
# 症状: ブラウザコンソールで以下のようなエラーが表示される
# Failed to fetch
# TypeError: Failed to fetch
# VITE_SUPABASE_URL: undefined
# VITE_SUPABASE_ANON_KEY: undefined

# 原因: Viteは実行時ではなくビルド時に環境変数を埋め込む
# docker-compose.prod.ymlで環境変数を設定しても反映されない

# 解決方法:
# 1. ローカルの.envファイルを確認
cat .env | grep VITE_

# 2. deploy-ecr.shが環境変数を読み込んでいることを確認
# スクリプト内に以下の行があることを確認：
# export $(cat .env | grep -E '^VITE_' | xargs)
# docker build --build-arg VITE_SUPABASE_URL="$VITE_SUPABASE_URL" ...

# 3. 再度ビルドしてデプロイ
./deploy-ecr.sh
```

#### ECRログインエラー
```bash
# エラー: Error response from daemon: Get https://754724220380.dkr.ecr...
# 解決方法:
aws ecr get-login-password --region ap-southeast-2 | \
docker login --username AWS --password-stdin \
754724220380.dkr.ecr.ap-southeast-2.amazonaws.com
```

#### IAMロール権限不足
```bash
# EC2インスタンスのIAMロールを確認
aws sts get-caller-identity

# 必要な権限:
# - ecr:GetAuthorizationToken
# - ecr:BatchCheckLayerAvailability
# - ecr:GetDownloadUrlForLayer
# - ecr:BatchGetImage
```

#### Dockerコンテナが起動しない
```bash
# 1. 既存コンテナの確認と削除
docker ps -a | grep watchme-web
docker rm -f watchme-web-prod

# 2. イメージの確認
docker images | grep watchme-web

# 3. 手動で起動してエラーログ確認
docker run --rm -it \
  --env-file .env \
  -p 3001:3001 \
  754724220380.dkr.ecr.ap-southeast-2.amazonaws.com/watchme-web:latest
```

#### 環境変数が反映されない
```bash
# .envファイルの確認
cat ~/watchme-docker/.env

# docker-compose.prod.ymlの環境変数セクション確認
grep -A 10 "environment:" docker-compose.prod.yml

# コンテナ内の環境変数確認
docker exec watchme-web-prod env | grep VITE
```

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

## 🗄️ データベース統合仕様（2025年7月実装）

### ✅ 心理グラフ（VibeGraph）- Supabase統合完了

#### **実装内容**
- **データソース**: `vibe_whisper_summary`テーブルから直接取得
- **環境変数**: `VITE_DATA_SOURCE=supabase`で制御
- **エンドポイント**: `/api/proxy/emotion-timeline-supabase/:deviceId/:date`
- **時間軸**: サーバー側で00:00〜23:30まで30分刻み48ポイントを自動生成

#### **データベーステーブル構造**
```sql
create table vibe_whisper_summary (
  device_id         text not null,
  date              date not null,
  vibe_scores       jsonb,      -- 48個のスコア配列（null混在可）
  average_score     double precision,
  positive_hours    double precision,
  negative_hours    double precision,
  neutral_hours     double precision,
  insights          jsonb,      -- ["〜だった", "〜と考えられる", ...]
  vibe_changes      jsonb,      -- [{ time, event, score }, ...]
  processed_at      timestamp with time zone,
  processing_log    jsonb,
  primary key (device_id, date)
);
```

#### **データ変換フロー**
1. **データベース**: `vibe_whisper_summary`からデバイスID・日付で検索
2. **サーバー処理**: 
   - `timePoints`配列を動的生成（00:00, 00:30, ..., 23:30）
   - `vibe_scores` → `emotionScores`
   - `vibe_changes` → `emotionChanges`
3. **フロントエンド**: Chart.jsで可視化（nullポイントは途切れ表示）


### 🗂️ 管理画面削除完了（2025年7月7日）

**システム設計変更**: ユーザー情報はSupabaseデータベースから取得する仕様に変更されたため、以下の管理画面機能を削除しました。

#### 削除した機能
- ✅ **管理画面ルーティング** - `/admin`と`/admin/user/:userId`パスを削除
- ✅ **ユーザー管理機能** - ユーザー作成・編集・削除機能
- ✅ **通知管理機能** - 管理画面での通知作成・管理機能
- ✅ **データアップロード機能** - 手動データアップロード機能
- ✅ **関連API** - createUser、updateUser、deleteUser、broadcastNotification

#### 影響なし
- ✅ **Dashboard**: 通知機能はUI部分のみ残存
- ✅ **認証システム**: Supabase認証はそのまま維持
- ✅ **デバイス管理**: DeviceViewは継続して使用

**理由**: ユーザー情報とデバイス情報はSupabaseデータベースで管理する新しい設計に移行済みのため、従来の管理画面は不要となりました。

### 🔧 技術仕様詳細

#### **useVaultAPIフック改修**
- パラメータ名を`userId`から`deviceId`に統一
- 環境変数による動的エンドポイント切り替え
- Supabaseモード時は専用エンドポイントを使用

#### **サーバー側実装**
- Express.jsに新エンドポイント追加
- Supabaseクライアント統合
- データ形式変換ロジック実装

#### **コンポーネント改修**
- `EmotionTimeline.jsx`（VibeGraph）をdeviceIdベースに変更
- プロップ名統一（`userId` → `deviceId`）
- データ表示ロジックはそのまま維持


## 🔐 認証・セキュリティシステム

### ✅ Supabase認証統合完了

**【2025年7月6日更新】** Supabase Auth.userを使用した本格的な認証システムとデバイス管理機能が実装されました。

#### 現在のアカウント管理方式
- **ログイン機能**: ✅ **実装完了** - Supabase Auth（メール/パスワード）
- **ログアウト機能**: ✅ **実装完了** - セッション管理対応
- **認証状態管理**: ✅ **実装完了** - useAuthカスタムフック
- **ルート保護**: ✅ **実装完了** - ProtectedRouteコンポーネント

#### デバイスベースデータ管理システム
- **ユーザーアカウント**: Supabaseのauth.usersテーブルで管理
- **デバイス管理**: 1ユーザーが複数のデバイス（device_id）を所有可能
- **グラフデータ**: 全てdevice_idに紐づく（心理グラフ、行動グラフ、感情グラフ）
- **データフロー**: ユーザーログイン → デバイス選択 → 選択デバイスのグラフ表示
- **デバイス切り替え**: ダッシュボード内でリアルタイムにデバイスを切り替え可能

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


---

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

