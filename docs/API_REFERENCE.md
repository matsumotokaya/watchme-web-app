# 🚀 WatchMe v8 API リファレンス

## 📖 概要

WatchMe v8 のバックエンドAPIの仕様書です。すべてのエンドポイント、リクエスト・レスポンス形式、エラーハンドリングについて詳しく説明します。

### 🌐 ベースURL
```
http://localhost:3001/api
```

### 📋 共通仕様
- **Content-Type**: `application/json`
- **文字エンコーディング**: UTF-8
- **日付形式**: `YYYY-MM-DD`
- **時刻形式**: `HH:MM`

---

## 🔐 認証

現在のバージョンでは認証システムは実装されていません。すべてのエンドポイントは認証なしでアクセス可能です。

**今後の実装予定**:
- JWT認証
- APIキー認証
- ロールベースアクセス制御

---

## 👥 ユーザー管理

### GET /users
すべてのユーザーリストを取得します。

#### **リクエスト**
```http
GET /api/users
```

#### **レスポンス**
```json
{
  "success": true,
  "data": [
    {
      "id": "user123",
      "name": "佐藤由紀子",
      "type": "master",
      "childrenIds": ["user456", "user789"],
      "createdAt": "2025-01-01T00:00:00.000Z",
      "lastLogin": "2025-01-15T12:00:00.000Z"
    },
    {
      "id": "user456",
      "name": "佐藤あやか",
      "type": "normal",
      "parentId": "user123",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "lastLogin": "2025-01-15T11:30:00.000Z"
    }
  ]
}
```

#### **エラーレスポンス**
```json
{
  "success": false,
  "error": "ユーザーデータの取得に失敗しました",
  "code": "USER_FETCH_ERROR"
}
```

---

## 📊 感情タイムライン

### GET /users/:userId/logs/:date/emotion-timeline
指定したユーザーの指定日の感情タイムラインデータを取得します。

#### **リクエスト**
```http
GET /api/users/user123/logs/2025-01-15/emotion-timeline
```

#### **パラメータ**
- `userId` (string): ユーザーID
- `date` (string): 日付 (YYYY-MM-DD形式)

#### **レスポンス**
```json
{
  "success": true,
  "data": {
    "date": "2025-01-15",
    "timePoints": [
      "00:00", "00:30", "01:00", "01:30"
    ],
    "emotionScores": [0, -5, 10, 15],
    "averageScore": 5.0,
    "positiveHours": 12,
    "negativeHours": 6,
    "neutralHours": 6,
    "insights": [
      "朝の時間帯に感情の波がありました",
      "午後は安定した心理状態を維持しています"
    ],
    "emotionChanges": [
      {
        "time": "08:30",
        "event": "朝食",
        "score": 15
      },
      {
        "time": "12:00",
        "event": "昼休み",
        "score": 25
      }
    ]
  }
}
```

#### **データ形式詳細**
- `timePoints`: 時刻の配列（30分間隔）
- `emotionScores`: 心理スコア配列（-100〜100）
- `averageScore`: 平均心理スコア
- `positiveHours`: ポジティブな時間（時間）
- `negativeHours`: ネガティブな時間（時間）
- `neutralHours`: ニュートラルな時間（時間）
- `insights`: AI分析による洞察
- `emotionChanges`: 重要な感情変化イベント

#### **エラーレスポンス**
```json
{
  "success": false,
  "error": "感情タイムラインデータが見つかりません",
  "code": "TIMELINE_NOT_FOUND"
}
```

---

## 📅 行動ログ

### GET /users/:userId/logs/:date/event-logs
指定したユーザーの指定日の行動ログデータを取得します。

#### **リクエスト**
```http
GET /api/users/user123/logs/2025-01-15/event-logs
```

#### **レスポンス**
```json
{
  "success": true,
  "data": {
    "date": "2025-01-15",
    "behaviorCounts": [
      {
        "type": "運動",
        "count": 3,
        "duration": 90,
        "color": "#22C55E"
      },
      {
        "type": "読書",
        "count": 2,
        "duration": 60,
        "color": "#3B82F6"
      }
    ],
    "timeDistribution": {
      "morning": 30,
      "afternoon": 45,
      "evening": 25
    },
    "insights": [
      "運動習慣が継続されています",
      "午後の活動量が多い傾向があります"
    ],
    "totalActivities": 5,
    "totalDuration": 150
  }
}
```

#### **データ形式詳細**
- `behaviorCounts`: 行動カテゴリ別の集計
  - `type`: 行動タイプ
  - `count`: 実行回数
  - `duration`: 合計時間（分）
  - `color`: 表示色（HEX）
- `timeDistribution`: 時間帯別分布（%）
- `insights`: 行動パターンの分析結果
- `totalActivities`: 総活動数
- `totalDuration`: 総活動時間（分）

---

## 🎭 感情分布

### GET /users/:userId/logs/:date/emotion-distribution
指定したユーザーの指定日の感情分布データを取得します。

#### **リクエスト**
```http
GET /api/users/user123/logs/2025-01-15/emotion-distribution
```

#### **レスポンス**
```json
{
  "success": true,
  "data": {
    "date": "2025-01-15",
    "emotionDistribution": [
      {
        "emotion": "喜",
        "percentage": 78,
        "color": "#22C55E"
      },
      {
        "emotion": "楽",
        "percentage": 60,
        "color": "#F59E0B"
      },
      {
        "emotion": "怒",
        "percentage": 25,
        "color": "#EF4444"
      },
      {
        "emotion": "驚",
        "percentage": 18,
        "color": "#8B5CF6"
      },
      {
        "emotion": "哀",
        "percentage": 12,
        "color": "#3B82F6"
      },
      {
        "emotion": "恐",
        "percentage": 5,
        "color": "#64748B"
      }
    ],
    "dominantEmotion": "喜",
    "insights": [
      "ポジティブな感情が全体の69%を占めています",
      "「喜」が最も高く、充実した1日でした"
    ],
    "comparison": {
      "previousWeek": {
        "喜": 65,
        "楽": 55,
        "怒": 30,
        "驚": 15,
        "哀": 18,
        "恐": 8
      },
      "change": {
        "喜": 13,
        "楽": 5,
        "怒": -5,
        "驚": 3,
        "哀": -6,
        "恐": -3
      }
    },
    "emotionalBalance": {
      "positive": 69,
      "negative": 31,
      "stability": "良好"
    }
  }
}
```

#### **データ形式詳細**
- `emotionDistribution`: 6感情の分布データ
- `dominantEmotion`: 最も強い感情
- `comparison`: 前週との比較データ
- `emotionalBalance`: 感情バランス評価

---

## 📢 通知管理

### GET /users/:userId/notifications
指定ユーザーの通知一覧を取得します。

#### **リクエスト**
```http
GET /api/users/user123/notifications
```

#### **クエリパラメータ**
- `limit` (number, optional): 取得件数制限（デフォルト: 50）
- `offset` (number, optional): オフセット（デフォルト: 0）
- `status` (string, optional): 絞り込み (`unread`, `read`, `all`)

#### **レスポンス**
```json
{
  "success": true,
  "data": [
    {
      "id": "notif_001",
      "title": "データ分析完了",
      "message": "本日の感情分析が完了しました。詳細をご確認ください。",
      "type": "analysis",
      "priority": "medium",
      "isRead": false,
      "createdAt": "2025-01-15T10:30:00.000Z",
      "readAt": null
    }
  ],
  "total": 1,
  "unreadCount": 1
}
```

### POST /users/:userId/notifications
特定ユーザーに通知を送信します。

#### **リクエスト**
```http
POST /api/users/user123/notifications
Content-Type: application/json

{
  "title": "重要なお知らせ",
  "message": "システムメンテナンスのお知らせです。",
  "type": "system",
  "priority": "high"
}
```

#### **リクエストボディ**
- `title` (string, required): 通知タイトル
- `message` (string, required): 通知メッセージ
- `type` (string, optional): 通知タイプ
- `priority` (string, optional): 優先度（`low`, `medium`, `high`）

#### **レスポンス**
```json
{
  "success": true,
  "data": {
    "id": "notif_002",
    "message": "通知を送信しました"
  }
}
```

### POST /notifications/broadcast
全ユーザーに一斉配信通知を送信します。

#### **リクエスト**
```http
POST /api/notifications/broadcast
Content-Type: application/json

{
  "title": "システムメンテナンス",
  "message": "明日の午前2時〜4時にシステムメンテナンスを実施します。",
  "type": "maintenance",
  "priority": "high",
  "targetUsers": ["user123", "user456"]
}
```

#### **リクエストボディ**
- `title` (string, required): 通知タイトル
- `message` (string, required): 通知メッセージ
- `type` (string, optional): 通知タイプ
- `priority` (string, optional): 優先度
- `targetUsers` (array, optional): 対象ユーザーID配列（指定しない場合は全ユーザー）

### DELETE /users/:userId/notifications/:notificationId
指定した通知を削除します。

#### **リクエスト**
```http
DELETE /api/users/user123/notifications/notif_001
```

#### **レスポンス**
```json
{
  "success": true,
  "message": "通知を削除しました"
}
```

### PATCH /users/:userId/notifications/:notificationId/read
通知の既読状態を更新します。

#### **リクエスト**
```http
PATCH /api/users/user123/notifications/notif_001/read
Content-Type: application/json

{
  "isRead": true
}
```

#### **レスポンス**
```json
{
  "success": true,
  "message": "既読状態を更新しました"
}
```

---

## ❌ エラーハンドリング

### HTTPステータスコード
- `200`: 正常終了
- `400`: リクエストエラー
- `404`: リソースが見つからない
- `500`: サーバー内部エラー

### エラーレスポンス形式
```json
{
  "success": false,
  "error": "エラーメッセージ",
  "code": "ERROR_CODE",
  "details": {
    "field": "エラーの詳細情報"
  }
}
```

### エラーコード一覧
- `USER_NOT_FOUND`: ユーザーが見つからない
- `DATA_NOT_FOUND`: データが見つからない
- `INVALID_DATE`: 無効な日付形式
- `INVALID_PARAMETER`: 無効なパラメータ
- `FILE_READ_ERROR`: ファイル読み取りエラー
- `VALIDATION_ERROR`: バリデーションエラー

---

## 🔄 レート制限

現在のバージョンではレート制限は実装されていませんが、今後以下の制限を設ける予定です：

- **一般API**: 100リクエスト/分
- **通知送信**: 10リクエスト/分
- **一斉配信**: 1リクエスト/時間

---

## 📝 使用例

### JavaScript (fetch API)
```javascript
// 感情タイムラインデータ取得
const getEmotionTimeline = async (userId, date) => {
  try {
    const response = await fetch(`/api/users/${userId}/logs/${date}/emotion-timeline`);
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('データ取得エラー:', error);
    throw error;
  }
};

// 通知送信
const sendNotification = async (userId, notification) => {
  try {
    const response = await fetch(`/api/users/${userId}/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(notification)
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('通知送信エラー:', error);
    throw error;
  }
};
```

### cURL
```bash
# ユーザーリスト取得
curl -X GET http://localhost:3001/api/users

# 感情タイムライン取得
curl -X GET http://localhost:3001/api/users/user123/logs/2025-01-15/emotion-timeline

# 通知送信
curl -X POST http://localhost:3001/api/users/user123/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "title": "テスト通知",
    "message": "これはテスト通知です",
    "type": "test",
    "priority": "medium"
  }'
```

---

## 🔧 開発者向け情報

### ローカル環境での API テスト
```bash
# サーバー起動
npm run server

# APIテスト用のサンプルリクエスト
curl -X GET http://localhost:3001/api/users
```

### データフォーマット検証
APIはデータ受信時に以下の検証を行います：
- 必須フィールドの存在確認
- データ型の検証
- 範囲値の確認（例：emotionScoresは-100〜100）
- 日付形式の検証

### カスタムヘッダー
将来的に以下のカスタムヘッダーの対応を予定：
- `X-API-Version`: APIバージョン指定
- `X-Request-ID`: リクエスト追跡用ID
- `X-Client-Type`: クライアントタイプ識別

---

## 📚 関連ドキュメント

- [システムドキュメント](./SYSTEM_DOCUMENTATION.md)
- [ユーザーマニュアル](./USER_MANUAL.md)
- [デプロイガイド](../DEPLOY.md)

---

**最終更新**: 2025年1月  
**APIバージョン**: v1.0  
**ドキュメントバージョン**: v1.0 