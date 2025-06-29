# 📊 WatchMe v8 システムドキュメント

## 🎯 システム概要

WatchMe v8は、ユーザーの心理状態と行動ログを可視化・分析するライフログツールです。モバイルファースト設計で、EC2 Vault APIからの感情分析結果を客観的に表示し、管理機能を提供します。

### 🏗️ アーキテクチャ
- **フロントエンド**: React 19 + Vite
- **バックエンド**: Express.js + Node.js
- **データストレージ**: ファイルベース（JSON）
- **UI Framework**: Tailwind CSS
- **チャートライブラリ**: Chart.js + react-chartjs-2

---

## 🎨 主要機能

### 📱 ダッシュボード（ユーザー画面）

#### 1. **感情タイムライン**
- **目的**: 1日の心理スコアの推移を時系列グラフで可視化
- **データ形式**: -100〜+100の心理スコア値
- **機能**:
  - リアルタイム心理グラフ表示
  - 感情変化イベントのマーカー表示
  - データ品質情報の表示
  - 柔軟なデータ前処理（NaN/null/float値対応）
  - インタラクティブなツールチップ

#### 2. **行動ログ**
- **目的**: 日々の行動パターンの分析と可視化
- **表示内容**:
  - 行動カテゴリ別の集計
  - 時間帯別の活動量
  - 行動ランキング

#### 3. **感情グラフ**
- **目的**: Plutchik 8感情分類の時系列グラフ表示
- **機能**: ⚠️ **【開発中】** 現在はモックデータを表示
  - 8感情要素の時系列変化
  - 感情フィルタリング機能
  - データサマリー表示

#### 4. **プロフィール**
- **目的**: ユーザー情報と設定の表示・管理
- **機能**:
  - アカウント情報表示
  - 設定変更（予定）

### 🔧 管理画面（Admin）

#### 1. **通知管理（NotificationManagement）**
- **目的**: システム通知の作成・配信・管理
- **機能**:
  - 個別通知の作成・送信
  - 一斉配信通知の作成・送信
  - 通知履歴の表示・管理
  - 通知の削除・既読管理

#### 2. **ユーザー詳細（UserDetail）**
- **目的**: 特定ユーザーの詳細データ表示と管理
- **機能**:
  - ユーザー情報の詳細表示
  - データ分析結果の確認

---

## 🗂️ データ構造

### 📁 ファイル構成
```
data_accounts/
├── user123/
│   ├── notifications.json          # 通知データ
│   ├── logs/
│   │   ├── 2025-05-22/
│   │   │   ├── emotion-timeline.json     # 感情タイムライン
│   │   │   ├── event-logs.json          # 行動ログ
│   │   │   └── emotion-distribution.json # 感情分布
│   │   └── ...
│   └── profile.json                # プロフィール情報
└── ...
```

### 📊 データ形式

#### **emotion-timeline.json**
```json
{
  "date": "2025-05-22",
  "timePoints": ["00:00", "00:10", "00:20", ...],
  "emotionScores": [0, -1, 5, ...],
  "averageScore": 12.5,
  "positiveHours": 14,
  "negativeHours": 6,
  "neutralHours": 4,
  "insights": ["分析結果1", "分析結果2"],
  "emotionChanges": [
    {
      "time": "12:00",
      "event": "昼食",
      "score": 15
    }
  ]
}
```

#### **event-logs.json**
```json
{
  "date": "2025-05-22",
  "behaviorCounts": [
    {
      "type": "運動",
      "count": 3,
      "color": "#22C55E"
    }
  ],
  "timeDistribution": { ... },
  "insights": ["行動分析結果"]
}
```

#### **emotion-graph.json（開発中）**
```json
{
  "date": "2025-05-22",
  "emotion_graph": [
    {
      "time": "00:00",
      "anger": 0, "fear": 0, "anticipation": 0, "surprise": 0,
      "joy": 0, "sadness": 0, "trust": 0, "disgust": 0
    }
  ]
}
```
⚠️ **注意**: 現在はモックデータのみ表示

---

## 🚀 使い方

### 🔄 開発環境での起動

#### **自動起動（推奨）**
```bash
# macOS/Linux
./start-dev.sh

# Windows (Git Bash)
bash start-dev.sh
```

#### **手動起動**
```bash
# バックエンド（ポート3001）
npm run server

# フロントエンド（ポート5173）
npm run dev
```

#### **停止**
```bash
# 自動停止
./stop-dev.sh

# 手動停止
# Ctrl+C で各プロセスを停止
```

### 🌐 本番環境での起動

```bash
# ビルド＆起動
./start-prod.sh

# 停止
./stop-prod.sh
```

### 📱 アクセス方法

- **ダッシュボード**: http://localhost:5173
- **管理画面**: http://localhost:5173/admin
- **API**: http://localhost:3001

### 👥 デフォルトユーザー

- **user123**: 佐藤由紀子（マスターアカウント）
- **user456**: 佐藤あやか（通常アカウント）
- **user789**: 佐藤みなと（通常アカウント）

---

## 🛠️ 技術仕様

### 📦 主要依存関係

#### **フロントエンド**
- React 19.1.0
- Vite 6.3.5
- react-router-dom 7.6.0
- Chart.js 4.4.9 + react-chartjs-2 5.3.0
- Tailwind CSS 4.1.7
- react-swipeable-views 0.14.0

#### **バックエンド**
- Express.js 4.21.2
- CORS 2.8.5
- Node.js（ECMAScript modules対応）

### 🎯 対応ブラウザ
- Chrome 90+
- Firefox 90+
- Safari 14+
- Edge 90+
- モバイルブラウザ（iOS Safari, Chrome Mobile）

### 📱 レスポンシブ設計
- **Primary**: モバイルファースト（375px〜）
- **Tablet**: 768px〜
- **Desktop**: 1024px〜

---

## 🔧 設定とカスタマイズ

### 🌈 テーマカラー
```css
/* tailwind.config.js */
primary: '#3B82F6'    /* ブルー */
success: '#22C55E'    /* グリーン */
warning: '#F59E0B'    /* オレンジ */
danger:  '#EF4444'    /* レッド */
```

### ⚙️ API エンドポイント

#### **データ取得**
- `GET /api/users` - ユーザーリスト取得
- `GET /api/users/:userId/logs/:date/emotion-timeline` - 感情タイムライン
- `GET /api/users/:userId/logs/:date/event-logs` - 行動ログ
- `GET /api/users/:userId/logs/:date/emotion-graph` - 感情グラフ（開発中）

#### **通知管理**
- `GET /api/users/:userId/notifications` - 通知取得
- `POST /api/users/:userId/notifications` - 通知作成
- `POST /api/notifications/broadcast` - 一斉配信
- `DELETE /api/users/:userId/notifications/:notificationId` - 通知削除
- `PATCH /api/users/:userId/notifications/:notificationId/read` - 既読状態更新

---

## 🔒 セキュリティ

### 🛡️ 現在の実装
- **CORS設定**: フロントエンドからのアクセスのみ許可
- **入力値検証**: データバリデーション・サニタイゼーション
- **エラーハンドリング**: 適切なエラーレスポンス

### 🚨 今後の改善予定
- 認証システムの実装
- HTTPS化
- APIレート制限
- ログ監査機能

---

## 🐛 トラブルシューティング

### ❌ よくある問題

#### **1. サーバーが起動しない**
```bash
# ポートが使用中の場合
lsof -ti:3001 | xargs kill -9  # バックエンド
lsof -ti:5173 | xargs kill -9  # フロントエンド

# 依存関係の再インストール
npm install
```

#### **2. データが表示されない**
- ブラウザの開発者ツールでコンソールエラーを確認
- `data_accounts/`ディレクトリにサンプルデータが存在するか確認
- APIエンドポイントが正常に応答しているか確認

#### **3. チャートが表示されない**
- データ形式が正しいかブラウザコンソールで確認
- Chart.jsの依存関係が正しく読み込まれているか確認

#### **4. 通知が表示されない**
- `data_accounts/{userId}/notifications.json`ファイルの存在確認
- 通知データの形式確認

### 🔍 デバッグ方法

#### **フロントエンド**
```javascript
// ブラウザ開発者ツールのコンソールで
console.log('データ確認:', data);
localStorage.clear(); // キャッシュクリア
```

#### **バックエンド**
```bash
# サーバーログの確認
tail -f server.log

# APIテスト
curl -X GET http://localhost:3001/api/users
```

---

## 📈 パフォーマンス最適化

### ⚡ 実装済み最適化
- **React Suspense**: 非同期コンポーネント読み込み
- **エラーバウンダリ**: コンポーネントレベルでのエラーハンドリング
- **並列データ取得**: Promise.allSettledを使用
- **柔軟なデータ処理**: 不正データに対する寛容な処理

### 🚀 推奨最適化（今後）
- メモ化（React.memo, useMemo）
- 仮想化（大量データ表示時）
- サービスワーカー（オフライン対応）
- CDN配信

---

## 📚 開発ガイド

### 🔄 開発ワークフロー

1. **機能開発**
   ```bash
   git checkout -b feature/新機能名
   # 開発作業
   npm run dev  # 開発サーバー起動
   ```

2. **テスト**
   ```bash
   npm run lint    # ESLintチェック
   npm run build   # ビルドテスト
   ```

3. **デプロイ**
   ```bash
   npm run build-and-start  # 本番ビルド＆起動
   ```

### 📁 コンポーネント構成
```
src/
├── pages/           # ページコンポーネント
├── components/      # 再利用可能コンポーネント
│   ├── common/      # 共通コンポーネント
│   ├── dashboard/   # ダッシュボード専用
│   └── admin/       # 管理画面専用
├── services/        # API通信・データ処理
├── utils/           # ユーティリティ関数
├── hooks/           # カスタムフック
└── layouts/         # レイアウトコンポーネント
```

### 🎨 コーディング規約
- **命名**: camelCase（変数・関数）、PascalCase（コンポーネント）
- **ファイル名**: PascalCase（.jsx）、kebab-case（.css）
- **インポート順**: React → サードパーティ → 内部モジュール
- **コメント**: 日本語でのビジネスロジック説明を推奨

---

## 📞 サポート・問い合わせ

### 🔧 技術的な問題
1. GitHub Issues での問題報告
2. 詳細なエラーログの添付
3. 再現手順の明記

### 📖 ドキュメント更新
このドキュメントは開発状況に応じて定期的に更新されます。最新版は常にプロジェクトルートの`docs/`ディレクトリを参照してください。

---

**最終更新**: 2025年1月
**ドキュメントバージョン**: v1.0
**システムバージョン**: WatchMe v8.0 